// src/components/ui/CaseDetail.tsx
import { MissingPerson, CaseStatus } from '@/types';
import { useAppStore } from '@/store';
import { api } from '@/lib/api';
import {
  getStatusLabel, getStatusColor, getStatusDot,
  calculateDaysMissing, formatDate, formatRelativeTime, cn,
} from '@/lib/utils';
import {
  X, MapPin, Calendar, Phone, Mail, User, FileText,
  Share2, Flag, CheckCircle, AlertTriangle, Clock,
  Download, Brain, History, Printer, Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';

interface Props { person: MissingPerson; onClose: () => void; }

const STATUS_ORDER: CaseStatus[] = ['open', 'investigating', 'sighting_reported', 'found', 'closed'];

const TIMELINE_STEPS = [
  { status: 'open', label: 'Case Filed', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' },
  { status: 'investigating', label: 'Investigating', icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  { status: 'sighting_reported', label: 'Sighting Reported', icon: MapPin, color: 'text-orange-600', bg: 'bg-orange-100' },
  { status: 'found', label: 'Person Found', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
];

export default function CaseDetail({ person, onClose }: Props) {
  const { updateStatus, currentUser, deleteCase } = useAppStore();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const days = calculateDaysMissing(person.lastSeenDate);
  const currentIdx = STATUS_ORDER.indexOf(person.status);
  const [activeTab, setActiveTab] = useState<'info' | 'timeline' | 'age'>('info');
  const [caseUpdates, setCaseUpdates] = useState<any[]>([]);
  const [loadingUpdates, setLoadingUpdates] = useState(false);
  const [agePhoto, setAgePhoto] = useState<string | null>(person.ageProgressed || null);
  const [generatingAge, setGeneratingAge] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  useEffect(() => {
    if (activeTab === 'timeline') fetchUpdates();
  }, [activeTab]);

  const fetchUpdates = async () => {
    setLoadingUpdates(true);
    try {
      const res = await api.cases.getUpdates(person.id) as any;
      if (res.success) setCaseUpdates(res.data || []);
    } catch { }
    setLoadingUpdates(false);
  };

  const handleDelete = async () => {
    try {
      await deleteCase(person.id);
      toast.success(`Case ${person.caseId} deleted successfully`);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete case');
    }
  };

  const handleShare = () => {
    const text = `MISSING PERSON ALERT\n\nName: ${person.name}\nAge: ${person.age} | Gender: ${person.gender}\nCase ID: ${person.caseId}\nLast Seen: ${person.lastSeenLocation}\nDate: ${formatDate(person.lastSeenDate)}\nContact: ${person.contactPhone}\n\nIf found, call 112 or contact the family immediately.`;
    navigator.clipboard.writeText(text);
    toast.success('Case details copied to clipboard!');
  };

  const handleStatusUpdate = (status: CaseStatus) => {
    updateStatus(person.id, status);
    toast.success(`Status updated to "${getStatusLabel(status)}"`);
  };

  // ── Age Progression via Claude Vision API ─────────────────────────────────
  const handleAgeProgression = async () => {
    if (!person.photos[0] || person.photos[0].includes('ui-avatars')) {
      toast.error('Please upload a real photo first to generate age progression.');
      return;
    }
    setGeneratingAge(true);
    toast.loading('Generating age progression...', { id: 'age' });
    try {
      const yearsMissing = Math.max(1, Math.round(days / 365));
      const projectedAge = person.age + yearsMissing;

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are an expert forensic age progression specialist. Analyze this photo of ${person.name}, currently ${person.age} years old.

Describe in detail how this person would look after ${yearsMissing} year(s) (projected age: ${projectedAge} years). Focus on:
- Facial feature changes (wrinkles, skin texture, hairline)
- Hair color and style changes
- Weight/face shape changes
- Any other aging indicators

Then provide a detailed description that law enforcement and the public can use to identify this person at age ${projectedAge}.

Format your response as:
**Age Progression Report for ${person.name}**
Current Age: ${person.age} | Projected Age: ${projectedAge}

**Physical Changes:**
[detailed changes]

**Updated Description for Identification:**
[description at projected age]`,
              },
              {
                type: 'image',
                source: {
                  type: 'url',
                  url: person.photos[0],
                },
              },
            ],
          }],
        }),
      });

      const data = await res.json();
      const text = data.content?.[0]?.text || '';
      setAgePhoto(text);
      toast.dismiss('age');
      toast.success('Age progression report generated!');
    } catch (err) {
      toast.dismiss('age');
      toast.error('Failed to generate age progression.');
    } finally {
      setGeneratingAge(false);
    }
  };

  // ── PDF Report Generation ──────────────────────────────────────────────────
  const handlePDFDownload = () => {
    setGeneratingPDF(true);
    toast.loading('Generating PDF report...', { id: 'pdf' });

    try {
      const photoSrc = person.photos[0] || '';
      const isAvatar = photoSrc.includes('ui-avatars');

      const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Missing Person Report - ${person.caseId}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'DM Sans', Arial, sans-serif; background: #fff; color: #111; padding: 0; }
  .page { width: 210mm; min-height: 297mm; padding: 16mm 18mm; margin: 0 auto; }
  .header { background: linear-gradient(135deg, #ea580c, #f97316); color: white; padding: 20px 24px; border-radius: 12px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; }
  .header-left h1 { font-family: 'Playfair Display', serif; font-size: 22px; margin-bottom: 4px; }
  .header-left p { font-size: 12px; opacity: 0.85; }
  .alert-band { background: #dc2626; color: white; text-align: center; padding: 10px; font-size: 18px; font-weight: 700; letter-spacing: 4px; border-radius: 8px; margin-bottom: 20px; }
  .main { display: flex; gap: 20px; margin-bottom: 20px; }
  .photo-box { width: 160px; flex-shrink: 0; }
  .photo-box img { width: 160px; height: 180px; object-fit: cover; border-radius: 10px; border: 3px solid #ea580c; }
  .photo-box .case-id { background: #1f2937; color: #f97316; font-family: monospace; font-size: 13px; font-weight: 700; padding: 8px; text-align: center; border-radius: 6px; margin-top: 8px; letter-spacing: 1px; }
  .info { flex: 1; }
  .name { font-family: 'Playfair Display', serif; font-size: 26px; color: #111; margin-bottom: 4px; }
  .sub { color: #6b7280; font-size: 13px; margin-bottom: 14px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .field { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 12px; }
  .field-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #9ca3af; margin-bottom: 3px; }
  .field-value { font-size: 13px; font-weight: 600; color: #111; }
  .section { margin-bottom: 16px; }
  .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #ea580c; border-bottom: 2px solid #fde68a; padding-bottom: 4px; margin-bottom: 10px; }
  .desc { font-size: 13px; line-height: 1.7; color: #374151; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px; }
  .marks { font-size: 13px; line-height: 1.7; color: #374151; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin-top: 8px; }
  .timeline { display: flex; gap: 0; margin-bottom: 16px; }
  .step { flex: 1; text-align: center; position: relative; }
  .step-dot { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 6px; font-size: 12px; font-weight: 700; }
  .step-line { position: absolute; top: 14px; left: 50%; width: 100%; height: 2px; z-index: -1; }
  .step-done .step-dot { background: #ea580c; color: white; }
  .step-pending .step-dot { background: #e5e7eb; color: #9ca3af; }
  .step-label { font-size: 10px; font-weight: 600; color: #6b7280; }
  .contact-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px; display: flex; gap: 20px; }
  .contact-item { font-size: 13px; }
  .contact-label { font-size: 10px; font-weight: 700; color: #16a34a; text-transform: uppercase; margin-bottom: 2px; }
  .footer { border-top: 2px solid #e5e7eb; padding-top: 14px; display: flex; justify-content: space-between; align-items: center; }
  .footer-left { font-size: 11px; color: #9ca3af; }
  .footer-right { text-align: right; font-size: 11px; color: #9ca3af; }
  .helpline { background: #1f2937; color: white; border-radius: 8px; padding: 10px 16px; display: flex; gap: 24px; margin-bottom: 16px; }
  .hl-item { text-align: center; }
  .hl-num { font-size: 18px; font-weight: 700; color: #f97316; }
  .hl-label { font-size: 10px; color: #9ca3af; }
  .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; }
  .status-open { background: #fee2e2; color: #dc2626; }
  .status-investigating { background: #dbeafe; color: #1d4ed8; }
  .status-sighting_reported { background: #fef3c7; color: #d97706; }
  .status-found { background: #d1fae5; color: #059669; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="page">
  <!-- Header -->
  <div class="header">
    <div class="header-left">
      <h1>FindThem India</h1>
      <p>Find Them India — an independent community platform. Not a government record.</p>
    </div>
    <div style="text-align:right; font-size:12px; opacity:0.85;">
      <div>Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
      <div>Report Type: Official Case Report</div>
    </div>
  </div>

  <!-- Alert Band -->
  <div class="alert-band">⚠ MISSING PERSON ALERT</div>

  <!-- Main Info -->
  <div class="main">
    <div class="photo-box">
      ${!isAvatar ? `<img src="${photoSrc}" alt="${person.name}" />` : `<div style="width:160px;height:180px;background:#f3f4f6;border-radius:10px;border:3px solid #ea580c;display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:13px;">No Photo</div>`}
      <div class="case-id">${person.caseId}</div>
      ${person.firNumber ? `<div style="text-align:center;font-size:11px;color:#6b7280;margin-top:6px;">FIR: ${person.firNumber}</div>` : ''}
    </div>
    <div class="info">
      <div class="name">${person.name}</div>
      <div class="sub">${person.age} Years Old • ${person.gender.charAt(0).toUpperCase() + person.gender.slice(1)}</div>
      <span class="status-badge status-${person.status}">${getStatusLabel(person.status)}</span>
      <div class="grid" style="margin-top:12px;">
        <div class="field"><div class="field-label">Last Seen Date</div><div class="field-value">${formatDate(person.lastSeenDate)}</div></div>
        <div class="field"><div class="field-label">Days Missing</div><div class="field-value" style="color:#dc2626;">${days} Days</div></div>
        <div class="field"><div class="field-label">Last Seen Location</div><div class="field-value">${person.lastSeenLocation}</div></div>
        <div class="field"><div class="field-label">District / State</div><div class="field-value">${person.district}, ${person.state}</div></div>
        ${person.assignedOfficer ? `<div class="field"><div class="field-label">Assigned Officer</div><div class="field-value">${person.assignedOfficer}</div></div>` : ''}
        <div class="field"><div class="field-label">Reported By</div><div class="field-value">${person.reportedBy}</div></div>
      </div>
    </div>
  </div>

  <!-- Description -->
  <div class="section">
    <div class="section-title">Physical Description</div>
    <div class="desc">${person.description}</div>
    ${person.distinguishingMarks ? `<div class="marks"><strong>Distinguishing Marks:</strong> ${person.distinguishingMarks}</div>` : ''}
  </div>

  <!-- Case Timeline -->
  <div class="section">
    <div class="section-title">Case Timeline</div>
    <div class="timeline">
      ${TIMELINE_STEPS.map((step, i) => {
        const stepIdx = STATUS_ORDER.indexOf(step.status as CaseStatus);
        const done = stepIdx <= currentIdx;
        return `<div class="step ${done ? 'step-done' : 'step-pending'}">
          <div class="step-dot">${i + 1}</div>
          <div class="step-label">${step.label}</div>
        </div>`;
      }).join('')}
    </div>
  </div>

  <!-- Helplines -->
  <div class="helpline">
    <div class="hl-item"><div class="hl-num">112</div><div class="hl-label">Emergency</div></div>
    <div class="hl-item"><div class="hl-num">1098</div><div class="hl-label">Child Helpline</div></div>
    <div class="hl-item"><div class="hl-num">100</div><div class="hl-label">Police</div></div>
    <div class="hl-item"><div class="hl-num">181</div><div class="hl-label">Women Helpline</div></div>
  </div>

  <!-- Contact -->
  <div class="section">
    <div class="section-title">Contact Information</div>
    <div class="contact-box">
      <div class="contact-item"><div class="contact-label">Contact Person</div><strong>${person.contactName}</strong></div>
      <div class="contact-item"><div class="contact-label">Phone</div><strong>${person.contactPhone}</strong></div>
      ${person.contactEmail ? `<div class="contact-item"><div class="contact-label">Email</div><strong>${person.contactEmail}</strong></div>` : ''}
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-left">
      <div><strong>FindThem India</strong> | findthemindia.vercel.app</div>
      <div>This is an official document generated by the National Missing Persons Portal</div>
    </div>
    <div class="footer-right">
      <div>Case ID: ${person.caseId}</div>
      <div>Report Date: ${new Date().toLocaleDateString('en-IN')}</div>
    </div>
  </div>
</div>
<script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      if (!win) {
        const a = document.createElement('a');
        a.href = url; a.download = `${person.caseId}_report.html`; a.click();
      }
      toast.dismiss('pdf');
      toast.success('PDF report opened! Use Ctrl+P to print or save as PDF.');
    } catch (err) {
      toast.dismiss('pdf');
      toast.error('Failed to generate report.');
    } finally {
      setGeneratingPDF(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-end p-4 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-xl h-full max-h-[calc(100vh-2rem)] flex flex-col shadow-2xl overflow-hidden">

        {/* Photo Header */}
        <div className="relative flex-shrink-0">
          <img
            src={person.photos[0] || `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&size=800&background=f97316&color=fff`}
            alt={person.name}
            className="w-full h-44 object-cover"
            onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&size=800&background=f97316&color=fff`; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <button onClick={onClose} className="absolute top-3 right-3 p-2 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-colors">
            <X size={16} className="text-white" />
          </button>
          <div className="absolute top-3 left-3">
            <span className={cn('badge', getStatusColor(person.status))}>
              <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse mr-1', 'bg-current')} />
              {getStatusLabel(person.status)}
            </span>
          </div>
          <div className="absolute bottom-3 left-4">
            <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>{person.name}</h2>
            <p className="text-white/60 text-xs font-mono mt-0.5">{person.caseId}</p>
          </div>
          {days > 0 && (
            <div className="absolute bottom-3 right-4 bg-red-600/90 text-white text-xs font-bold px-3 py-1.5 rounded-xl">
              Missing {days} days
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 bg-gray-50 flex-shrink-0">
          {[
            { id: 'info', label: 'Details', icon: User },
            { id: 'timeline', label: 'Timeline', icon: History },
            { id: 'age', label: 'Age AI', icon: Brain },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={cn('flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-all',
                activeTab === tab.id ? 'text-orange-600 border-b-2 border-orange-500 bg-white' : 'text-gray-400 hover:text-gray-600')}>
              <tab.icon size={13} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* ── DETAILS TAB ── */}
          {activeTab === 'info' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Age & Gender', value: `${person.age} yrs • ${person.gender}` },
                  { label: 'Last Seen', value: person.lastSeenLocation },
                  { label: 'Date', value: formatDate(person.lastSeenDate) },
                  { label: 'FIR Number', value: person.firNumber || 'Not filed' },
                  { label: 'District', value: person.district },
                  { label: 'State', value: person.state },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">{label}</p>
                    <p className="text-sm font-semibold text-gray-800">{value}</p>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Description</p>
                <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-4 border border-gray-100">{person.description}</p>
              </div>

              {person.distinguishingMarks && (
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                  <p className="text-xs font-bold text-orange-700 mb-1">Distinguishing Marks</p>
                  <p className="text-sm text-orange-800">{person.distinguishingMarks}</p>
                </div>
              )}

              {/* Contact */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Contact Information</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <User size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-700 font-medium">{person.contactName}</span>
                  </div>
                  <a href={`tel:${person.contactPhone}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-orange-50 transition-colors">
                    <Phone size={14} className="text-gray-400" />
                    <span className="text-sm font-mono text-gray-700">{person.contactPhone}</span>
                  </a>
                  {person.contactEmail && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <Mail size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-700">{person.contactEmail}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status update */}
              {currentUser && ['police', 'admin', 'ngo'].includes(currentUser.role) && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Update Status</p>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_ORDER.filter(s => s !== person.status).map(s => (
                      <button key={s} onClick={() => handleStatusUpdate(s)}
                        className={cn('badge cursor-pointer hover:opacity-80 transition-opacity', getStatusColor(s))}>
                        {getStatusLabel(s)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── TIMELINE TAB ── */}
          {activeTab === 'timeline' && (
            <>
              {/* Visual progress */}
              <div className="space-y-1">
                {TIMELINE_STEPS.map((step, idx) => {
                  const stepIdx = STATUS_ORDER.indexOf(step.status as CaseStatus);
                  const done = stepIdx <= currentIdx;
                  const active = step.status === person.status;
                  const Icon = step.icon;
                  return (
                    <div key={step.status} className="flex gap-3 items-start">
                      <div className="flex flex-col items-center">
                        <div className={cn('w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border-2',
                          done
                            ? `${step.bg} border-current ${step.color}`
                            : 'bg-gray-100 border-gray-200 text-gray-300')}>
                          <Icon size={15} />
                        </div>
                        {idx < TIMELINE_STEPS.length - 1 && (
                          <div className={cn('w-0.5 h-8 mt-1', done ? 'bg-orange-300' : 'bg-gray-200')} />
                        )}
                      </div>
                      <div className={cn('pt-1.5', !done && 'opacity-40')}>
                        <p className={cn('text-sm font-bold', active ? step.color : done ? 'text-gray-700' : 'text-gray-400')}>
                          {step.label}
                          {active && <span className="ml-2 text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">Current</span>}
                        </p>
                        {done && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {active ? `Since ${formatDate(person.updatedAt)}` : 'Completed'}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Case updates list */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 mt-2">Case Activity Log</p>
                {loadingUpdates ? (
                  <div className="text-center py-6">
                    <div className="w-6 h-6 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto" />
                  </div>
                ) : caseUpdates.length > 0 ? (
                  <div className="space-y-3">
                    {caseUpdates.map((u: any) => (
                      <div key={u.id} className="flex gap-3">
                        <div className="w-2 h-2 bg-orange-400 rounded-full flex-shrink-0 mt-2" />
                        <div className="flex-1 bg-gray-50 rounded-xl p-3 border border-gray-100">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-gray-700">{u.author}</span>
                            <span className="text-[10px] text-gray-400">{formatRelativeTime(u.created_at)}</span>
                          </div>
                          <p className="text-xs text-gray-600">{u.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-400 text-sm">No activity recorded yet.</div>
                )}
              </div>
            </>
          )}

          {/* ── AGE PROGRESSION TAB ── */}
          {activeTab === 'age' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-sm font-bold text-blue-800 mb-1">AI Age Progression</p>
                <p className="text-xs text-blue-600 leading-relaxed">
                  Claude AI analyzes the uploaded photo and generates a detailed forensic age progression report showing how the person may look after {Math.max(1, Math.round(days / 365))} year(s) missing.
                </p>
              </div>

              {!agePhoto ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Brain size={28} className="text-orange-500" />
                  </div>
                  <p className="text-gray-600 font-medium mb-1">Generate Age Progression Report</p>
                  <p className="text-xs text-gray-400 mb-5">
                    Current Age: {person.age} → Projected Age: {person.age + Math.max(1, Math.round(days / 365))} years
                  </p>
                  <button onClick={handleAgeProgression} disabled={generatingAge}
                    className="btn-primary flex items-center gap-2 mx-auto">
                    {generatingAge ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing…</>
                    ) : (
                      <><Brain size={15} /> Generate Report</>
                    )}
                  </button>
                  {person.photos[0]?.includes('ui-avatars') && (
                    <p className="text-xs text-red-500 mt-3">⚠️ Upload a real photo first for accurate results.</p>
                  )}
                </div>
              ) : (
                <div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-mono text-xs">
                    {agePhoto}
                  </div>
                  <button onClick={() => { setAgePhoto(null); }}
                    className="btn-secondary text-xs mt-3 w-full">
                    Regenerate Report
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 flex gap-2 flex-shrink-0">
          <button onClick={handleShare} className="btn-secondary flex items-center justify-center gap-1.5 text-xs py-2.5 flex-1">
            <Share2 size={13} /> Share
          </button>
          <button onClick={handlePDFDownload} disabled={generatingPDF}
            className="btn-secondary flex items-center justify-center gap-1.5 text-xs py-2.5 flex-1">
            <Printer size={13} /> PDF Report
          </button>
          <button className="btn-primary flex items-center justify-center gap-1.5 text-xs py-2.5 flex-1">
            <Flag size={13} /> Report Sighting
          </button>
          {currentUser?.role === 'admin' && (
            <button onClick={() => setConfirmDelete(true)}
              className="flex items-center justify-center gap-1.5 text-xs py-2.5 px-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors border border-red-200">
              <Trash2 size={13} />
            </button>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {confirmDelete && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 rounded-2xl">
            <div className="bg-white rounded-2xl p-6 mx-4 shadow-2xl max-w-sm w-full">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <Trash2 size={18} className="text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">Delete Case?</h3>
                  <p className="text-xs text-gray-500">{person.caseId} • {person.name}</p>
                </div>
              </div>
              <p className="text-xs text-gray-600 mb-4">
                This case will be permanently deleted. All related sightings and updates will also be removed. This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleDelete}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors">
                  Delete Case
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}