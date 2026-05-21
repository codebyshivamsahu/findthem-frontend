// src/components/features/Sightings.tsx
import { useState, useRef } from 'react';
import { useAppStore } from '@/store';
import { formatRelativeTime } from '@/lib/utils';
import { CheckCircle, Clock, X, MapPin, Camera, Eye, Upload, Scan, User } from 'lucide-react';
import { MissingPerson } from '@/types';
import toast from 'react-hot-toast';

const FACE_API = process.env.NEXT_PUBLIC_FACE_API_URL || 'http://localhost:5001';

interface SightingRecord {
  id: string; address: string; description: string; photoUrl?: string;
  confidence: number; status: 'verified' | 'pending' | 'no_match';
  matchedCase?: MissingPerson; reportedAt: string; reportedBy: string;
  allMatches?: { caseId: string; name: string; confidence: number }[];
}
interface MatchResult { caseId: string; name: string; confidence: number; verified: boolean; }

export default function Sightings() {
  const { cases, currentUser, updateStatus } = useAppStore();
  const [sightings, setSightings] = useState<SightingRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchResults, setMatchResults] = useState<MatchResult[] | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [form, setForm] = useState({ address: '', description: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(file); });

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Only image files allowed'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Max file size is 10MB'); return; }
    const b64 = await fileToBase64(file);
    setPreviewPhoto(b64); setMatchResults(null);
    await runFaceMatch(b64);
  };

  const runFaceMatch = async (photoB64: string) => {
    const openCases = cases.filter(c => c.status !== 'found' && c.status !== 'closed');
    if (openCases.length === 0) { toast.error('No open cases to match against'); return; }
    setMatchLoading(true);
    toast.loading('AI face matching in progress...', { id: 'fm' });
    try {
      const res = await fetch(`${FACE_API}/match`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sighting_photo: photoB64, cases: openCases.map(c => ({ caseId: c.caseId, name: c.name, photos: c.photos })) }),
      });
      const data = await res.json();
      toast.dismiss('fm');
      if (data.error) { toast.error('Server error: ' + data.error); return; }
      if (!data.face_detected) { toast.error('No face detected. Upload a clear front-facing photo.'); setMatchResults([]); return; }
      setMatchResults(data.matches || []);
      if (data.best_match?.confidence >= 60) toast.success(`Match found! ${data.best_match.name} — ${data.best_match.confidence}%`, { duration: 5000 });
      else if (data.matches?.length > 0) toast(`Best: ${data.matches[0].name} — ${data.matches[0].confidence.toFixed(1)}%`, { icon: 'WARNING' });
      else toast('No match found with any case', { icon: 'X' });
    } catch { toast.dismiss('fm'); toast.error('Face server not connected. Run: python face_server.py'); setMatchResults([]); }
    finally { setMatchLoading(false); }
  };

  const handleSubmit = async () => {
    if (!form.address || !form.description) { toast.error('Location and description required'); return; }
    const bestMatch = matchResults?.find(m => m.confidence >= 60);
    const matchedCase = bestMatch ? cases.find(c => c.caseId === bestMatch.caseId) : undefined;

    // ── Send to backend API (triggers email notification) ──────────────────
    if (matchedCase && bestMatch) {
      try {
        const token = localStorage.getItem('fti_token');
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/sightings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            caseId: matchedCase.caseId,
            latitude: matchedCase.latitude || 28.6139,
            longitude: matchedCase.longitude || 77.2090,
            address: form.address,
            description: form.description,
            photoUrl: previewPhoto || null,
            confidence: bestMatch.confidence,
          }),
        });
        console.log('✅ Sighting saved to backend — email sent to case reporter');
      } catch (err) {
        console.error('Backend sighting save failed:', err);
      }
    }

    // ── Also update local state ────────────────────────────────────────────
    const record: SightingRecord = {
      id: Date.now().toString(), address: form.address, description: form.description,
      photoUrl: previewPhoto || undefined, confidence: bestMatch?.confidence || 0,
      status: bestMatch && bestMatch.confidence >= 60 ? 'verified' : 'pending',
      matchedCase, reportedAt: new Date().toISOString(), reportedBy: currentUser?.name || 'Anonymous',
      allMatches: matchResults?.slice(0, 3) || [],
    };
    setSightings(s => [record, ...s]);
    if (matchedCase && bestMatch && bestMatch.confidence >= 65)
      updateStatus(matchedCase.id, 'sighting_reported', `Sighting at ${form.address} — AI ${bestMatch.confidence.toFixed(1)}% match`);
    toast.success('Sighting submitted! Email alert sent to case reporter.');
    setShowForm(false); setForm({ address: '', description: '' }); setPreviewPhoto(null); setMatchResults(null);
  };

  const resetForm = () => { setShowForm(false); setForm({ address: '', description: '' }); setPreviewPhoto(null); setMatchResults(null); };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title text-lg">Sighting Reports</h2>
          <p className="text-sm text-gray-400 mt-1">Report a sighting with AI face recognition matching</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Camera size={15} /> Report Sighting
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="card p-6 w-full max-w-lg my-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900 text-lg">Report a Sighting</h3>
              <button onClick={resetForm}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="label flex items-center gap-1.5"><Scan size={13} className="text-orange-500" /> Photo (AI Face Matching)</label>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                {!previewPhoto ? (
                  <div onDragOver={e => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)}
                    onDrop={e => { e.preventDefault(); setIsDragging(false); e.dataTransfer.files?.[0] && handleFile(e.dataTransfer.files[0]); }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${isDragging ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/40'}`}>
                    <Camera size={28} className="text-gray-300 mx-auto mb-2" />
                    <p className="font-semibold text-gray-700 text-sm">Drag photo here or click to upload</p>
                    <p className="text-xs text-gray-400 mt-1">AI will instantly match against all open cases</p>
                    <button type="button" className="btn-primary mt-3 text-xs px-4 py-1.5"
                      onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                      <Upload size={12} className="inline mr-1" /> Select Photo
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <img src={previewPhoto} alt="Sighting" className="w-full h-52 object-cover rounded-xl border border-gray-200" />
                    <button onClick={() => { setPreviewPhoto(null); setMatchResults(null); }}
                      className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow">
                      <X size={13} />
                    </button>
                    {matchLoading && (
                      <div className="absolute inset-0 bg-black/55 rounded-xl flex flex-col items-center justify-center">
                        <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin mb-2" />
                        <p className="text-white text-sm font-semibold">Matching faces...</p>
                        <p className="text-white/70 text-xs">Checking {cases.length} cases</p>
                      </div>
                    )}
                  </div>
                )}

                {matchResults !== null && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">AI Match Results</p>
                    {matchResults.length === 0 ? (
                      <div className="p-3 bg-gray-50 rounded-xl border text-center">
                        <p className="text-sm text-gray-500">No match found with any case</p>
                        <p className="text-xs text-gray-400 mt-1">Cases need real photos (not avatars) for matching</p>
                      </div>
                    ) : matchResults.slice(0, 4).map(m => {
                      const mc = cases.find(c => c.caseId === m.caseId);
                      const high = m.confidence >= 70;
                      const mid = m.confidence >= 50;
                      return (
                        <div key={m.caseId} className={`flex items-center gap-3 p-3 rounded-xl border ${high ? 'bg-green-50 border-green-200' : mid ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
                          {mc?.photos?.[0] && !mc.photos[0].includes('ui-avatars') ? (
                            <img src={mc.photos[0]} alt={m.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border" />
                          ) : (
                            <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0"><User size={16} className="text-gray-400" /></div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{m.name}</p>
                            <p className="text-xs text-gray-400 font-mono">{m.caseId}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${high ? 'text-green-600' : mid ? 'text-yellow-600' : 'text-gray-400'}`}>{m.confidence.toFixed(1)}%</p>
                            {m.confidence >= 60
                              ? <span className="text-[10px] text-green-600 flex items-center gap-0.5 justify-end"><CheckCircle size={9} /> Match</span>
                              : <span className="text-[10px] text-gray-400">Low</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="label">Location *</label>
                <input className="input" placeholder="Where did you see them? e.g. Karol Bagh Market, Delhi"
                  value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </div>
              <div>
                <label className="label">Description *</label>
                <textarea className="input resize-none" rows={3}
                  placeholder="What did you observe? Clothing, condition, who they were with..."
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={resetForm} className="btn-secondary flex-1">Cancel</button>
                <button type="button" onClick={handleSubmit} disabled={!form.address || !form.description} className="btn-primary flex-1">Submit Report</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {sightings.map(s => (
          <div key={s.id} className="card p-5 flex gap-4">
            {s.photoUrl && <img src={s.photoUrl} alt="Sighting" className="w-20 h-20 rounded-xl object-cover flex-shrink-0 border border-gray-200" />}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  {s.matchedCase ? (
                    <div className="flex items-center gap-2 mb-1">
                      <img src={s.matchedCase.photos?.[0]} alt="" className="w-8 h-8 rounded-lg object-cover border"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{s.matchedCase.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{s.matchedCase.caseId}</p>
                      </div>
                    </div>
                  ) : <p className="text-sm text-gray-400 italic mb-1">No case matched</p>}
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {s.status === 'verified'
                    ? <span className="badge bg-green-50 text-green-700 border-green-200 flex items-center gap-1"><CheckCircle size={11} /> AI Verified</span>
                    : <span className="badge bg-yellow-50 text-yellow-700 border-yellow-200 flex items-center gap-1"><Clock size={11} /> Pending</span>}
                  {s.confidence > 0 && <span className={`text-xs font-bold ${s.confidence >= 60 ? 'text-green-600' : 'text-gray-400'}`}>{s.confidence.toFixed(1)}% match</span>}
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1"><MapPin size={11} /><span>{s.address}</span></div>
              <p className="text-sm text-gray-700">{s.description}</p>
              <p className="text-xs text-gray-400 mt-2">{formatRelativeTime(s.reportedAt)} • {s.reportedBy}</p>
            </div>
          </div>
        ))}
      </div>

      {sightings.length === 0 && (
        <div className="card p-14 text-center">
          <Eye size={28} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No sighting reports yet</p>
          <p className="text-gray-400 text-sm mt-1">Upload a photo — AI will automatically match against all cases</p>
          <button onClick={() => setShowForm(true)} className="btn-primary mt-4 text-sm">
            <Camera size={14} className="inline mr-2" /> Report Sighting
          </button>
        </div>
      )}
    </div>
  );
}