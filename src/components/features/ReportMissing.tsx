// src/components/features/ReportMissing.tsx
import { useState, useRef } from 'react';
import { useAppStore } from '@/store';
import { INDIAN_STATES } from '@/lib/mockData';
import { Upload, CheckCircle, AlertCircle, X, Image } from 'lucide-react';
import toast from 'react-hot-toast';

type Step = 'personal' | 'location' | 'contact' | 'photos' | 'review';
const STEPS: Step[] = ['personal', 'location', 'contact', 'photos', 'review'];
const STEP_LABELS: Record<Step, string> = {
  personal: 'Personal Details',
  location: 'Last Seen Location',
  contact:  'Contact Information',
  photos:   'Upload Photos',
  review:   'Review & Submit',
};

const DEFAULT_FORM = {
  name: '', age: '', gender: 'male' as const, description: '',
  distinguishingMarks: '', lastSeenDate: '', lastSeenLocation: '',
  lastSeenAddress: '', district: '', state: '',
  contactName: '', contactPhone: '', contactEmail: '',
  firNumber: '', photos: [] as string[],
};

export default function ReportMissing() {
  const { addCase, currentUser, setActiveView } = useAppStore();
  const [step, setStep]           = useState<Step>('personal');
  const [form, setForm]           = useState({ ...DEFAULT_FORM });
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging]     = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stepIdx  = STEPS.indexOf(step);
  const update   = (key: keyof typeof DEFAULT_FORM, val: any) => setForm(f => ({ ...f, [key]: val }));
  const next     = () => setStep(STEPS[Math.min(stepIdx + 1, STEPS.length - 1)]);
  const prev     = () => setStep(STEPS[Math.max(stepIdx - 1, 0)]);

  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (arr.length === 0) { toast.error('Only image files are allowed (JPG, PNG)'); return; }
    if (arr.some(f => f.size > 10 * 1024 * 1024)) { toast.error('File size must be under 10MB'); return; }
    try {
      const dataUrls = await Promise.all(arr.map(fileToDataUrl));
      setForm(f => ({ ...f, photos: [...f.photos, ...dataUrls].slice(0, 5) }));
      toast.success(`${arr.length} photo${arr.length > 1 ? 's' : ''} uploaded!`);
    } catch {
      toast.error('Photo upload failed, please try again');
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) handleFiles(e.target.files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  };

  const removePhoto = (i: number) =>
    setForm(f => ({ ...f, photos: f.photos.filter((_, j) => j !== i) }));

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result = await addCase({
        name: form.name, age: parseInt(form.age), gender: form.gender as any,
        description: form.description, distinguishingMarks: form.distinguishingMarks,
        lastSeenDate: form.lastSeenDate, lastSeenLocation: form.lastSeenLocation,
        lastSeenAddress: form.lastSeenAddress, district: form.district, state: form.state,
        contactName: form.contactName, contactPhone: form.contactPhone,
        contactEmail: form.contactEmail, firNumber: form.firNumber,
        photos: form.photos.length > 0
          ? form.photos
          : [`https://ui-avatars.com/api/?name=${encodeURIComponent(form.name)}&size=400&background=f97316&color=fff`],
        reportedBy: currentUser?.name || 'Anonymous',
      });
      setSubmitted(result.caseId);
      toast.success(`Case ${result.caseId} filed successfully!`);
    } catch (err: any) {
      toast.error(err.message || 'Submission failed, please try again');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 max-w-lg mx-auto text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-5">
          <CheckCircle size={36} className="text-green-600" />
        </div>
        <h2 className="section-title mb-2">Case Filed Successfully</h2>
        <p className="text-gray-500 mb-4">Your case has been registered. Share this Case ID with authorities.</p>
        <div className="bg-gray-900 text-green-400 font-mono text-2xl font-bold px-8 py-4 rounded-2xl mb-6 tracking-wider">
          {submitted}
        </div>
        <p className="text-sm text-gray-400 mb-6">Alerts are being sent to nearby users and police stations.</p>
        <div className="flex gap-3">
          <button onClick={() => setActiveView('cases')} className="btn-secondary">View Cases</button>
          <button onClick={() => { setForm({ ...DEFAULT_FORM }); setStep('personal'); setSubmitted(null); }} className="btn-primary">
            File Another Case
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">Report Missing Person</h2>
          <span className="text-sm text-gray-400">Step {stepIdx + 1} of {STEPS.length}</span>
        </div>
        <div className="flex gap-1 mb-3">
          {STEPS.map((s, i) => (
            <div key={s} className={`flex-1 h-1.5 rounded-full transition-all ${i <= stepIdx ? 'bg-orange-500' : 'bg-gray-200'}`} />
          ))}
        </div>
        <p className="text-sm font-semibold text-orange-600">{STEP_LABELS[step]}</p>
      </div>

      <div className="card p-6 space-y-5">
        {step === 'personal' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Full Name *</label>
                <input className="input" placeholder="Enter full name" value={form.name} onChange={e => update('name', e.target.value)} />
              </div>
              <div>
                <label className="label">Age *</label>
                <input className="input" type="number" placeholder="Age in years" value={form.age} onChange={e => update('age', e.target.value)} />
              </div>
              <div>
                <label className="label">Gender *</label>
                <select className="input" value={form.gender} onChange={e => update('gender', e.target.value)}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Physical Description *</label>
              <textarea className="input resize-none" rows={3}
                placeholder="Physical appearance, clothing when last seen, any other details..."
                value={form.description} onChange={e => update('description', e.target.value)} />
            </div>
            <div>
              <label className="label">Distinguishing Marks</label>
              <input className="input" placeholder="Scars, tattoos, birthmarks, moles..." value={form.distinguishingMarks} onChange={e => update('distinguishingMarks', e.target.value)} />
            </div>
            <div>
              <label className="label">FIR Number (if filed)</label>
              <input className="input" placeholder="e.g. FIR-2024-1234" value={form.firNumber} onChange={e => update('firNumber', e.target.value)} />
            </div>
          </>
        )}

        {step === 'location' && (
          <>
            <div>
              <label className="label">Date Last Seen *</label>
              <input className="input" type="date" value={form.lastSeenDate} onChange={e => update('lastSeenDate', e.target.value)} max={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <label className="label">Last Seen Location *</label>
              <input className="input" placeholder="e.g. Rajiv Chowk Metro Station" value={form.lastSeenLocation} onChange={e => update('lastSeenLocation', e.target.value)} />
            </div>
            <div>
              <label className="label">Full Address</label>
              <textarea className="input resize-none" rows={2} placeholder="Complete address with pincode"
                value={form.lastSeenAddress} onChange={e => update('lastSeenAddress', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">State *</label>
                <select className="input" value={form.state} onChange={e => update('state', e.target.value)}>
                  <option value="">Select state</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">District *</label>
                <input className="input" placeholder="District name" value={form.district} onChange={e => update('district', e.target.value)} />
              </div>
            </div>
          </>
        )}

        {step === 'contact' && (
          <>
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700">Contact information will be shared with police and NGOs. Your privacy is protected.</p>
              </div>
            </div>
            <div>
              <label className="label">Your Name *</label>
              <input className="input" placeholder="Full name of reporter" value={form.contactName} onChange={e => update('contactName', e.target.value)} />
            </div>
            <div>
              <label className="label">Phone Number *</label>
              <input className="input" type="tel" placeholder="+91 XXXXX XXXXX" value={form.contactPhone} onChange={e => update('contactPhone', e.target.value)} />
            </div>
            <div>
              <label className="label">Email Address</label>
              <input className="input" type="email" placeholder="your@email.com" value={form.contactEmail} onChange={e => update('contactEmail', e.target.value)} />
            </div>
          </>
        )}

        {step === 'photos' && (
          <div className="space-y-4">
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileInput} />
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all
                ${isDragging ? 'border-orange-400 bg-orange-50 scale-[1.01]' : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'}`}
            >
              <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Image size={28} className="text-orange-500" />
              </div>
              <p className="font-semibold text-gray-700">Click or drag photos here</p>
              <p className="text-sm text-gray-400 mt-1">JPG, PNG, WEBP — max 10MB each, up to 5 photos</p>
              <p className="text-xs text-orange-500 mt-2 font-medium">Upload a clear front-facing photo for AI face matching</p>
              <button type="button" className="btn-primary mt-4 text-sm px-6"
                onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                <Upload size={14} className="inline mr-2" /> Select Photos
              </button>
            </div>
            {form.photos.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {form.photos.map((photo, i) => (
                  <div key={i} className="relative group">
                    <img src={photo} alt={`Photo ${i+1}`} className="w-full h-28 object-cover rounded-xl border border-gray-200" />
                    <button type="button" onClick={() => removePhoto(i)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {form.photos.length < 5 && (
                  <div onClick={() => fileInputRef.current?.click()}
                    className="h-28 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center cursor-pointer hover:border-orange-300 hover:bg-orange-50 transition-all">
                    <div className="text-center">
                      <Upload size={18} className="text-gray-300 mx-auto mb-1" />
                      <span className="text-xs text-gray-400">Add more</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            <p className="text-xs text-gray-400 text-center">
              {form.photos.length === 0 ? 'Photo is optional but required for AI face matching' : `${form.photos.length}/5 photos added`}
            </p>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-4">
            <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
              <p className="text-sm font-semibold text-orange-800">Please verify all details before submitting</p>
            </div>
            {[
              { label: 'Name',         value: form.name },
              { label: 'Age / Gender', value: `${form.age} years / ${form.gender}` },
              { label: 'Last Seen',    value: `${form.lastSeenLocation}, ${form.district}, ${form.state}` },
              { label: 'Date',         value: form.lastSeenDate },
              { label: 'Contact',      value: `${form.contactName} • ${form.contactPhone}` },
              { label: 'FIR Number',   value: form.firNumber || 'Not filed' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start gap-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide w-28 flex-shrink-0 pt-0.5">{label}</span>
                <span className="text-sm text-gray-800 font-medium">{value}</span>
              </div>
            ))}
            {form.photos.length > 0 && (
              <div className="flex items-start gap-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide w-28 flex-shrink-0 pt-0.5">Photos</span>
                <div className="flex gap-2">
                  {form.photos.map((p,i) => <img key={i} src={p} alt="" className="w-14 h-14 rounded-lg object-cover border border-gray-200" />)}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between pt-4 border-t border-gray-100">
          {stepIdx > 0 ? <button onClick={prev} className="btn-secondary">← Back</button> : <div />}
          {stepIdx < STEPS.length - 1 ? (
            <button onClick={next} className="btn-primary" disabled={
              (step === 'personal' && (!form.name || !form.age)) ||
              (step === 'location' && (!form.lastSeenDate || !form.lastSeenLocation || !form.state || !form.district)) ||
              (step === 'contact'  && (!form.contactName || !form.contactPhone))
            }>Next →</button>
          ) : (
            <button onClick={handleSubmit} disabled={isSubmitting} className="btn-primary min-w-32">
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg> Submitting...
                </span>
              ) : 'Submit Case'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
