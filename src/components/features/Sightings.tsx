// src/components/features/Sightings.tsx
import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store';
import { api } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';
import { CheckCircle, Clock, X, MapPin, Camera, Eye, Upload, Scan, User } from 'lucide-react';
import { MissingPerson } from '@/types';
import toast from 'react-hot-toast';

const FACE_API = process.env.NEXT_PUBLIC_FACE_API_URL || 'http://localhost:5001';

interface SightingRecord {
  id: string; address: string; description: string; photoUrl?: string;
  /** Photo similarity score from the face service. An assistive hint, not a verification. */
  similarity: number;
  status: 'verified' | 'pending' | 'dismissed';
  matchedCase?: MissingPerson; reportedAt: string; reportedBy: string;
  allMatches?: { caseId: string; name: string; confidence: number }[];
}
interface MatchResult { caseId: string; name: string; confidence: number; verified: boolean; }

export default function Sightings() {
  const { cases, currentUser, sightingCaseId, clearSightingCase } = useAppStore();
  const [sightings, setSightings] = useState<SightingRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchResults, setMatchResults] = useState<MatchResult[] | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [form, setForm] = useState({ caseId: '', address: '', description: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [caseQuery, setCaseQuery] = useState('');
  const [reviewing, setReviewing] = useState<string | null>(null);

  // Only police and admins can act on a report. Everyone else just sees status.
  const canReview = currentUser?.role === 'police' || currentUser?.role === 'admin';

  const handleReview = async (id: string, status: 'verified' | 'dismissed') => {
    setReviewing(id);
    try {
      await api.sightings.review(id, status);
      setSightings(list => list.map(s => (s.id === id ? { ...s, status } : s)));
      toast.success(status === 'verified'
        ? 'Marked verified — the family has been told a reviewer confirmed it'
        : 'Sighting dismissed');
    } catch (err: any) {
      toast.error(err?.message || 'Could not update the sighting');
    } finally {
      setReviewing(null);
    }
  };

  // Arrived here from a case's "Report Sighting" button — open the form with
  // that case already chosen.
  useEffect(() => {
    if (!sightingCaseId) return;
    setForm(f => ({ ...f, caseId: sightingCaseId }));
    setShowForm(true);
    clearSightingCase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sightingCaseId]);

  // Show what the server actually has, not just what this browser submitted.
  useEffect(() => {
    api.sightings.list()
      .then((res: any) => {
        if (!res?.data) return;
        setSightings(res.data.map((r: any) => ({
          id: r.id,
          address: r.address,
          description: r.description,
          photoUrl: r.photo_url || undefined,
          similarity: r.confidence ?? 0,
          status: r.status,
          matchedCase: cases.find(c => c.caseId === r.case_id),
          reportedAt: r.reported_at,
          reportedBy: r.reported_by || 'A user',
        })));
      })
      .catch(() => { /* not signed in, or API down — keep the local list */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    toast.loading('Comparing photo against open cases...', { id: 'fm' });
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
      if (data.matches?.length > 0) {
        // Pre-select the closest case as a convenience. The reporter can change
        // it — the score is a hint about which case this might belong to, not a
        // decision about whether the sighting is real.
        setForm(f => ({ ...f, caseId: f.caseId || data.matches[0].caseId }));
        toast(`Closest case: ${data.matches[0].name}. Check it's the right one.`, { duration: 4000 });
      } else {
        toast('No similar case photo found — pick the case yourself');
      }
    } catch { toast.dismiss('fm'); toast.error('Face server not connected. Run: python face_server.py'); setMatchResults([]); }
    finally { setMatchLoading(false); }
  };

  // Only cases someone could still be sighted on.
  const activeCases = cases.filter(c => c.status !== 'found' && c.status !== 'closed');
  const selectedCase = activeCases.find(c => c.caseId === form.caseId);

  // With a query, search across name, case ID and place. Without one, show the
  // most recently reported — that is what a search is usually reaching for, and
  // it keeps the list short when there are hundreds of cases.
  const q = caseQuery.trim().toLowerCase();
  const caseOptions = (q
    ? activeCases.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.caseId.toLowerCase().includes(q) ||
        (c.district || '').toLowerCase().includes(q) ||
        (c.state || '').toLowerCase().includes(q))
    : [...activeCases].sort((a, b) =>
        new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime())
  ).slice(0, 8);

  const handleSubmit = async () => {
    if (!form.address || !form.description) { toast.error('Location and description required'); return; }

    // The case is whatever the reporter selected. A photo is optional, and a
    // low similarity score never blocks a report: the face service compares
    // image gradients, so it cannot rule out a real sighting, and a genuine
    // report with an old or badly-lit case photo would be lost.
    const matchedCase = cases.find(c => c.caseId === form.caseId);
    if (!matchedCase) {
      toast.error('Select which case this sighting relates to');
      return;
    }

    const best = matchResults?.slice().sort((a, b) => b.confidence - a.confidence)[0];

    setSubmitting(true);
    try {
      await api.sightings.create({
        caseId: matchedCase.caseId,
        latitude: matchedCase.latitude,
        longitude: matchedCase.longitude,
        address: form.address,
        description: form.description,
        photoUrl: previewPhoto || undefined,
      });

      setSightings(s => [{
        id: Date.now().toString(),
        address: form.address,
        description: form.description,
        photoUrl: previewPhoto || undefined,
        similarity: best?.confidence || 0,
        status: 'pending',
        matchedCase,
        reportedAt: new Date().toISOString(),
        reportedBy: currentUser?.name || 'You',
        allMatches: matchResults?.slice(0, 3) || [],
      }, ...s]);

      toast.success('Sighting submitted. The family has been notified.');
      setShowForm(false); setForm({ caseId: '', address: '', description: '' });
      setPreviewPhoto(null); setMatchResults(null);
    } catch (err: any) {
      toast.error(err?.message || 'Could not submit the sighting');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => { setShowForm(false); setForm({ caseId: '', address: '', description: '' }); setPreviewPhoto(null); setMatchResults(null); setCaseQuery(''); };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title text-lg">Sighting Reports</h2>
          <p className="text-sm text-gray-400 mt-1">Report a sighting — the family is notified straight away</p>
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
                <label className="label flex items-center gap-1.5"><Scan size={13} className="text-orange-500" /> Photo (optional)</label>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                {!previewPhoto ? (
                  <div onDragOver={e => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)}
                    onDrop={e => { e.preventDefault(); setIsDragging(false); e.dataTransfer.files?.[0] && handleFile(e.dataTransfer.files[0]); }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${isDragging ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/40'}`}>
                    <Camera size={28} className="text-gray-300 mx-auto mb-2" />
                    <p className="font-semibold text-gray-700 text-sm">Drag photo here or click to upload</p>
                    <p className="text-xs text-gray-400 mt-1">Used to suggest which case this might be — you can also pick it yourself</p>
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
                        <p className="text-white text-sm font-semibold">Comparing photo...</p>
                        <p className="text-white/70 text-xs">Checking {activeCases.length} open cases</p>
                      </div>
                    )}
                  </div>
                )}

                {matchResults !== null && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Photo similarity</p>
                    <p className="text-[11px] text-gray-400 -mt-1">A similarity score, not an identification. Every sighting is reviewed by a person before anyone is contacted.</p>
                    {matchResults.length === 0 ? (
                      <div className="p-3 bg-gray-50 rounded-xl border text-center">
                        <p className="text-sm text-gray-500">No similar case photo found — select the case below</p>
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
                            <span className="text-[10px] text-gray-400">similarity</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="label">Which case? *</label>
                {selectedCase ? (
                  <div className="mb-4 flex items-center justify-between gap-3 p-3 rounded-xl border border-orange-200 bg-orange-50">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{selectedCase.name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {selectedCase.age} yrs &bull; {selectedCase.district}, {selectedCase.state} &bull; {selectedCase.caseId}
                      </p>
                    </div>
                    <button type="button" className="text-xs font-semibold text-orange-600 hover:text-orange-700 shrink-0"
                      onClick={() => { setForm(f => ({ ...f, caseId: '' })); setCaseQuery(''); }}>
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="mb-4">
                    <input className="input" placeholder="Search by name, case ID or district"
                      value={caseQuery} onChange={e => setCaseQuery(e.target.value)} />
                    <p className="text-[11px] text-gray-400 mt-1.5 mb-1">
                      {caseQuery.trim() ? 'Matching cases' : 'Most recently reported'}
                    </p>
                    <div className="max-h-52 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-100">
                      {caseOptions.length === 0 ? (
                        <p className="text-sm text-gray-400 p-3">No open case matches that search</p>
                      ) : caseOptions.map(c => (
                        <button key={c.caseId} type="button"
                          onClick={() => setForm(f => ({ ...f, caseId: c.caseId }))}
                          className="w-full text-left p-3 hover:bg-orange-50/60 transition-colors">
                          <p className="font-semibold text-gray-900 text-sm">{c.name}</p>
                          <p className="text-xs text-gray-500">
                            {c.age} yrs &bull; {c.district}, {c.state} &bull; {c.caseId}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

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
                <button type="button" onClick={handleSubmit} disabled={!form.caseId || !form.address || !form.description || submitting} className="btn-primary flex-1">{submitting ? 'Submitting…' : 'Submit Report'}</button>
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
                    ? <span className="badge bg-green-50 text-green-700 border-green-200 flex items-center gap-1"><CheckCircle size={11} /> Verified by reviewer</span>
                    : s.status === 'dismissed'
                    ? <span className="badge bg-gray-50 text-gray-600 border-gray-200 flex items-center gap-1"><X size={11} /> Dismissed</span>
                    : <span className="badge bg-yellow-50 text-yellow-700 border-yellow-200 flex items-center gap-1"><Clock size={11} /> Awaiting review</span>}
                  {s.similarity > 0 && <span className="text-xs font-bold text-gray-400">{s.similarity.toFixed(1)}% similarity</span>}
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1"><MapPin size={11} /><span>{s.address}</span></div>
              <p className="text-sm text-gray-700">{s.description}</p>
              <p className="text-xs text-gray-400 mt-2">{formatRelativeTime(s.reportedAt)} • {s.reportedBy}</p>

              {canReview && s.status === 'pending' && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-[11px] text-gray-400 mb-2">
                    Verifying tells the family a reviewer found this credible. It is not a
                    confirmed identification — only the police can confirm that.
                  </p>
                  <div className="flex gap-2">
                    <button type="button" disabled={reviewing === s.id}
                      onClick={() => handleReview(s.id, 'verified')}
                      className="flex-1 text-xs font-semibold py-2 rounded-lg border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50">
                      {reviewing === s.id ? 'Saving…' : 'Verify'}
                    </button>
                    <button type="button" disabled={reviewing === s.id}
                      onClick={() => handleReview(s.id, 'dismissed')}
                      className="flex-1 text-xs font-semibold py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50">
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {sightings.length === 0 && (
        <div className="card p-14 text-center">
          <Eye size={28} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No sighting reports yet</p>
          <p className="text-gray-400 text-sm mt-1">Upload a photo to compare it against open cases, then submit the report for review</p>
          <button onClick={() => setShowForm(true)} className="btn-primary mt-4 text-sm">
            <Camera size={14} className="inline mr-2" /> Report Sighting
          </button>
        </div>
      )}
    </div>
  );
}