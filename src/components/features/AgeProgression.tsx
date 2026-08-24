// src/components/features/AgeProgression.tsx
import { useState, useRef } from 'react';
import { useAppStore } from '@/store';
import { MissingPerson } from '@/types';
import { Wand2, Download, RefreshCw, User, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

const AGE_GROUPS = [
  { label: '+5 years',  years: 5  },
  { label: '+10 years', years: 10 },
  { label: '+15 years', years: 15 },
  { label: '+20 years', years: 20 },
];

async function applyAgeProgression(imageUrl: string, yearsToAdd: number, currentAge: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas  = document.createElement('canvas');
      canvas.width  = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data      = imageData.data;
      const intensity = Math.min(yearsToAdd / 40, 1); // 0 to 1 based on years

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i+1], b = data[i+2];

        // Detect skin tone pixels (simplified)
        const isSkin = r > 60 && g > 40 && b > 20 && r > g && r > b && (r - g) > 10;

        if (isSkin) {
          // Age effect: slight darkening, reduce saturation, add warmth
          const gray  = 0.299 * r + 0.587 * g + 0.114 * b;
          const blend = intensity * 0.35;
          data[i]   = Math.min(255, r * (1 - blend) + (gray * 0.9 + 5) * blend);
          data[i+1] = Math.min(255, g * (1 - blend) + (gray * 0.85)    * blend);
          data[i+2] = Math.min(255, b * (1 - blend) + (gray * 0.8)     * blend);
        }

        // Add slight overall desaturation for aging
        const avg    = (data[i] + data[i+1] + data[i+2]) / 3;
        const desat  = intensity * 0.15;
        data[i]   = Math.min(255, data[i]   * (1 - desat) + avg * desat);
        data[i+1] = Math.min(255, data[i+1] * (1 - desat) + avg * desat);
        data[i+2] = Math.min(255, data[i+2] * (1 - desat) + avg * desat);
      }

      ctx.putImageData(imageData, 0, 0);

      // Add aging overlay: subtle texture
      ctx.globalAlpha = intensity * 0.08;
      ctx.fillStyle   = '#8B7355';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;

      // Add watermark
      ctx.globalAlpha = 0.7;
      ctx.fillStyle   = 'white';
      ctx.font        = `bold ${Math.max(10, canvas.width * 0.022)}px Arial`;
      ctx.textAlign   = 'right';
      ctx.fillText(`Filtered reference +${yearsToAdd} yrs (est. age ${currentAge + yearsToAdd}) — not a forensic likeness`, canvas.width - 10, canvas.height - 10);
      ctx.globalAlpha = 1;

      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = imageUrl;
  });
}

export default function AgeProgression() {
  const { cases } = useAppStore();
  const [selectedCase, setSelectedCase]   = useState<MissingPerson | null>(null);
  const [selectedYears, setSelectedYears] = useState(10);
  const [processing, setProcessing]       = useState(false);
  const [resultImage, setResultImage]     = useState<string | null>(null);
  const [showDropdown, setShowDropdown]   = useState(false);

  const openCases = cases.filter(c =>
    c.status !== 'found' && c.status !== 'closed' &&
    c.photos?.[0] && !c.photos[0].includes('ui-avatars')
  );

  const handleGenerate = async () => {
    if (!selectedCase) { toast.error('Please select a case'); return; }
    const photo = selectedCase.photos?.[0];
    if (!photo || photo.includes('ui-avatars')) {
      toast.error('This case has no real photo uploaded. Please upload a photo first.');
      return;
    }

    setProcessing(true);
    setResultImage(null);
    try {
      const result = await applyAgeProgression(photo, selectedYears, selectedCase.age);
      setResultImage(result);
      toast.success(`Reference image generated: +${selectedYears} years`);
    } catch (err) {
      toast.error('Failed to process image. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultImage || !selectedCase) return;
    const link    = document.createElement('a');
    link.download = `age-progression-${selectedCase.caseId}-+${selectedYears}yrs.jpg`;
    link.href     = resultImage;
    link.click();
    toast.success('Image downloaded');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="section-title text-lg">Age Reference Filter</h2>
        <p className="text-sm text-gray-400 mt-1">
          Apply a simple visual filter to a case photo — a rough reference image, not a forensic age progression
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="card p-6 space-y-5">
          <div>
            <label className="label">Select Case</label>
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="input w-full text-left flex items-center justify-between"
              >
                <span className={selectedCase ? 'text-gray-900' : 'text-gray-400'}>
                  {selectedCase ? `${selectedCase.name} — ${selectedCase.caseId}` : 'Choose a missing person case...'}
                </span>
                <ChevronDown size={16} className="text-gray-400" />
              </button>
              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-20 max-h-56 overflow-y-auto">
                  {openCases.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-400">
                      No cases with real photos found
                    </div>
                  ) : openCases.map(c => (
                    <button key={c.id}
                      onClick={() => { setSelectedCase(c); setShowDropdown(false); setResultImage(null); }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-orange-50 transition-colors text-left border-b border-gray-50 last:border-0">
                      <img src={c.photos[0]} alt={c.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.caseId} • Age {c.age}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedCase && (
            <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
              <div className="flex items-center gap-3">
                <img src={selectedCase.photos?.[0]} alt={selectedCase.name}
                  className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow" />
                <div>
                  <p className="font-bold text-gray-900">{selectedCase.name}</p>
                  <p className="text-sm text-gray-500">Current Age: {selectedCase.age} years</p>
                  <p className="text-sm text-orange-600 font-semibold">
                    Estimated Age: {selectedCase.age + selectedYears} years
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="label">Years to Progress</label>
            <div className="grid grid-cols-2 gap-2">
              {AGE_GROUPS.map(g => (
                <button key={g.years}
                  onClick={() => setSelectedYears(g.years)}
                  className={`p-3 rounded-xl border text-sm font-semibold transition-all
                    ${selectedYears === g.years
                      ? 'border-orange-400 bg-orange-50 text-orange-700 ring-1 ring-orange-300'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!selectedCase || processing}
            className="btn-primary w-full flex items-center justify-center gap-2 h-12"
          >
            {processing ? (
              <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg> Generating...</>
            ) : (
              <><Wand2 size={18} /> Generate Age Progression</>
            )}
          </button>

          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-xs text-blue-700">
              <strong>This is not a forensic age progression.</strong> It applies an image
              filter (skin-tone desaturation and a warm overlay) to suggest passing time.
              It does not predict how anyone will actually look and must never be used to
              identify a person or circulated as an official likeness. Real age progression
              is done by trained forensic artists.
            </p>
          </div>
        </div>

        {/* Result */}
        <div className="card p-6">
          <h3 className="font-bold text-gray-800 mb-4">Result</h3>
          {resultImage ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase mb-2">Original Photo</p>
                  <img src={selectedCase?.photos?.[0]} alt="Original"
                    className="w-full aspect-square object-cover rounded-xl border border-gray-200" />
                  <p className="text-xs text-center text-gray-400 mt-1">Age {selectedCase?.age}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase mb-2">Age Progression</p>
                  <img src={resultImage} alt="Age Progression"
                    className="w-full aspect-square object-cover rounded-xl border-2 border-orange-200" />
                  <p className="text-xs text-center text-orange-600 font-semibold mt-1">
                    Est. Age {(selectedCase?.age || 0) + selectedYears}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleDownload} className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm">
                  <Download size={14} /> Download
                </button>
                <button onClick={handleGenerate} className="btn-secondary flex items-center gap-2 text-sm px-4">
                  <RefreshCw size={14} /> Regenerate
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <User size={28} className="text-gray-300" />
              </div>
              <p className="text-gray-400 font-medium">No result yet</p>
              <p className="text-gray-300 text-sm mt-1">Select a case and click Generate</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
