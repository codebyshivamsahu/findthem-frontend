// src/components/features/PDFReport.tsx
import { useState } from 'react';
import { useAppStore } from '@/store';
import { MissingPerson } from '@/types';
import { formatDate, calculateDaysMissing, getStatusLabel } from '@/lib/utils';
import { FileText, Download, Printer, Search, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

function generatePDFHTML(person: MissingPerson): string {
  const photoSrc = person.photos?.[0] || '';
  const days = calculateDaysMissing(person.lastSeenDate);
  const isChild = person.age < 18;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Missing Person Report — ${person.caseId}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Arial', sans-serif; color: #1f2937; background: white; }
  .page { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 15mm; }
  
  .header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 12px; border-bottom: 3px solid #ea580c; margin-bottom: 16px; }
  .logo-section { display: flex; align-items: center; gap: 12px; }
  .logo { width: 52px; height: 52px; background: #ea580c; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-size: 22px; font-weight: 900; }
  .org-name { font-size: 18px; font-weight: 800; color: #1f2937; }
  .org-sub  { font-size: 11px; color: #6b7280; margin-top: 2px; }
  .doc-info { text-align: right; }
  .doc-type { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; }
  .case-id  { font-size: 18px; font-weight: 900; color: #ea580c; font-family: monospace; }
  .print-date { font-size: 10px; color: #9ca3af; margin-top: 2px; }

  ${isChild ? '.amber-banner { background: #fef2f2; border: 2px solid #dc2626; border-radius: 8px; padding: 10px 16px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }' : ''}
  ${isChild ? '.amber-text { font-size: 13px; font-weight: 800; color: #dc2626; letter-spacing: 1px; }' : ''}
  ${isChild ? '.amber-sub { font-size: 11px; color: #991b1b; margin-top: 2px; }' : ''}

  .main-section { display: grid; grid-template-columns: 200px 1fr; gap: 20px; margin-bottom: 20px; }
  .photo-box { text-align: center; }
  .photo-box img { width: 180px; height: 220px; object-fit: cover; border-radius: 10px; border: 2px solid #e5e7eb; }
  .photo-placeholder { width: 180px; height: 220px; background: linear-gradient(135deg, #f97316, #ea580c); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-size: 60px; font-weight: 900; }
  .photo-label { font-size: 10px; color: #6b7280; margin-top: 6px; text-transform: uppercase; letter-spacing: 0.5px; }

  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .info-item { background: #f9fafb; border-radius: 8px; padding: 10px; }
  .info-label { font-size: 9px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 700; }
  .info-value { font-size: 13px; font-weight: 600; color: #111827; margin-top: 3px; }
  .info-item.full { grid-column: 1 / -1; }

  .status-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
  .status-open  { background: #fee2e2; color: #dc2626; }
  .status-found { background: #dcfce7; color: #16a34a; }
  .status-other { background: #fef3c7; color: #d97706; }

  .section { margin-bottom: 18px; }
  .section-title { font-size: 12px; font-weight: 800; color: #374151; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb; margin-bottom: 10px; }
  .desc-text { font-size: 12px; color: #374151; line-height: 1.6; }
  .marks-box { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 6px; padding: 8px 12px; font-size: 12px; color: #92400e; }

  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

  .contact-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 12px; }
  .contact-name { font-size: 14px; font-weight: 700; color: #0c4a6e; }
  .contact-row  { font-size: 12px; color: #0369a1; margin-top: 4px; }

  .helpline-box { background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 8px; padding: 12px; }
  .helpline-title { font-size: 11px; font-weight: 700; color: #6b21a8; margin-bottom: 6px; text-transform: uppercase; }
  .helpline-row { display: flex; justify-content: space-between; font-size: 11px; color: #7c3aed; margin-bottom: 3px; }

  .footer { border-top: 2px solid #e5e7eb; padding-top: 12px; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #9ca3af; }
  .footer-bold { font-weight: 700; color: #6b7280; }
  .confidential { background: #fef2f2; color: #dc2626; padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 9px; letter-spacing: 1px; }

  .days-missing { display: inline-block; background: #dc2626; color: white; padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; margin-top: 6px; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { margin: 0; padding: 10mm; }
  }
</style>
</head>
<body>
<div class="page">
  <!-- Header -->
  <div class="header">
    <div class="logo-section">
      <div class="logo">FT</div>
      <div>
        <div class="org-name">FindThem India</div>
        <div class="org-sub">National Missing Persons Portal • Ministry of Home Affairs</div>
      </div>
    </div>
    <div class="doc-info">
      <div class="doc-type">Official Missing Person Report</div>
      <div class="case-id">${person.caseId}</div>
      <div class="print-date">Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
    </div>
  </div>

  ${isChild ? `
  <div class="amber-banner">
    <div style="font-size: 20px;">🚨</div>
    <div>
      <div class="amber-text">⚠ CHILD MISSING ALERT</div>
      <div class="amber-sub">This case involves a minor. Immediate action required. Contact Child Helpline: 1098</div>
    </div>
  </div>` : ''}

  <!-- Main Info -->
  <div class="main-section">
    <div class="photo-box">
      ${photoSrc && !photoSrc.includes('ui-avatars')
      ? `<img src="${photoSrc}" alt="${person.name}" />`
      : `<div class="photo-placeholder">${person.name.charAt(0)}</div>`}
      <div class="photo-label">Official Photo</div>
      ${days > 0 ? `<div class="days-missing">Missing ${days} days</div>` : ''}
    </div>
    <div>
      <h2 style="font-size:22px; font-weight:900; color:#111827; margin-bottom:4px;">${person.name}</h2>
      <p style="font-size:12px; color:#6b7280; font-family:monospace;">${person.caseId} ${person.firNumber ? '• FIR: ' + person.firNumber : ''}</p>
      <span class="status-badge ${person.status === 'found' ? 'status-found' : person.status === 'open' ? 'status-open' : 'status-other'}" style="margin-top:8px; display:inline-block;">
        ${getStatusLabel(person.status).toUpperCase()}
      </span>
      <div class="info-grid" style="margin-top:14px;">
        <div class="info-item">
          <div class="info-label">Age</div>
          <div class="info-value">${person.age} Years</div>
        </div>
        <div class="info-item">
          <div class="info-label">Gender</div>
          <div class="info-value">${person.gender.charAt(0).toUpperCase() + person.gender.slice(1)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Date Last Seen</div>
          <div class="info-value">${formatDate(person.lastSeenDate)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">District / State</div>
          <div class="info-value">${person.district}, ${person.state}</div>
        </div>
        <div class="info-item full">
          <div class="info-label">Last Seen Location</div>
          <div class="info-value">${person.lastSeenLocation}</div>
        </div>
        ${person.lastSeenAddress ? `<div class="info-item full">
          <div class="info-label">Full Address</div>
          <div class="info-value" style="font-size:12px;">${person.lastSeenAddress}</div>
        </div>` : ''}
      </div>
    </div>
  </div>

  <!-- Description -->
  <div class="section">
    <div class="section-title">Physical Description</div>
    <p class="desc-text">${person.description}</p>
    ${person.distinguishingMarks ? `
    <div class="marks-box" style="margin-top:8px;">
      <strong>Distinguishing Marks:</strong> ${person.distinguishingMarks}
    </div>` : ''}
  </div>

  <!-- Contact & Helplines -->
  <div class="two-col">
    <div class="section">
      <div class="section-title">Contact Information</div>
      <div class="contact-box">
        <div class="contact-name">${person.contactName}</div>
        <div class="contact-row">📞 ${person.contactPhone}</div>
        ${person.contactEmail ? `<div class="contact-row">✉ ${person.contactEmail}</div>` : ''}
      </div>
    </div>
    <div class="section">
      <div class="section-title">Emergency Helplines</div>
      <div class="helpline-box">
        <div class="helpline-title">If you spot this person:</div>
        <div class="helpline-row"><span>Police Emergency</span><strong>100</strong></div>
        <div class="helpline-row"><span>National Emergency</span><strong>112</strong></div>
        <div class="helpline-row"><span>Child Helpline</span><strong>1098</strong></div>
        <div class="helpline-row"><span>Women Helpline</span><strong>1091</strong></div>
      </div>
    </div>
  </div>

  ${person.assignedOfficer ? `
  <div class="section">
    <div class="section-title">Assigned Officer</div>
    <div class="info-item" style="display:inline-block; min-width:200px;">
      <div class="info-label">Officer In Charge</div>
      <div class="info-value">${person.assignedOfficer}</div>
    </div>
  </div>` : ''}

  <!-- Footer -->
  <div class="footer">
    <div>
      <span class="footer-bold">FindThem India</span> • findthemindia.vercel.app • info@findthemindia.vercel.app
    </div>
    <div style="text-align:center; color:#6b7280;">
      Case ${person.caseId} • Page 1 of 1
    </div>
    <div>
      <span class="confidential">OFFICIAL DOCUMENT</span>
    </div>
  </div>
</div>
</body>
</html>`;
}

export default function PDFReport() {
  const { cases } = useAppStore();
  const [selectedCase, setSelectedCase] = useState<MissingPerson | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [generating, setGenerating] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const filtered = cases.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.caseId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePrint = () => {
    if (!selectedCase) { toast.error('Please select a case'); return; }
    setGenerating(true);
    try {
      const html = generatePDFHTML(selectedCase);
      const win = window.open('', '_blank');
      if (!win) { toast.error('Please allow popups for this site'); return; }
      win.document.write(html);
      win.document.close();
      setTimeout(() => { win.print(); }, 500);
      toast.success('Print dialog opened');
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!selectedCase) { toast.error('Please select a case'); return; }
    setGenerating(true);
    try {
      const html = generatePDFHTML(selectedCase);
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Missing-Report-${selectedCase.caseId}.html`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Report downloaded — open in browser and Print as PDF');
    } catch {
      toast.error('Download failed');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="section-title text-lg">PDF Report Generator</h2>
        <p className="text-sm text-gray-400 mt-1">
          Generate official printable missing person reports for police and authorities
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="card p-6 space-y-5">
          <div>
            <label className="label">Select Case</label>
            <div className="relative">
              <button onClick={() => setShowDropdown(!showDropdown)}
                className="input w-full text-left flex items-center justify-between">
                <span className={selectedCase ? 'text-gray-900' : 'text-gray-400'}>
                  {selectedCase ? `${selectedCase.name} — ${selectedCase.caseId}` : 'Choose a case...'}
                </span>
                <ChevronDown size={16} className="text-gray-400" />
              </button>
              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-20">
                  <div className="p-2 border-b border-gray-100">
                    <div className="relative">
                      <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input className="input pl-8 py-1.5 text-sm" placeholder="Search..."
                        value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                  </div>
                  <div className="max-h-56 overflow-y-auto">
                    {filtered.length === 0 ? (
                      <p className="p-4 text-center text-sm text-gray-400">No cases found</p>
                    ) : filtered.map(c => (
                      <button key={c.id} onClick={() => { setSelectedCase(c); setShowDropdown(false); }}
                        className="w-full flex items-center gap-3 p-3 hover:bg-orange-50 transition-colors text-left border-b border-gray-50 last:border-0">
                        <img
                          src={c.photos?.[0] || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&size=80&background=f97316&color=fff`}
                          alt={c.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                          onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&size=80&background=f97316&color=fff`; }}
                        />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                          <p className="text-xs text-gray-400 font-mono">{c.caseId} • {c.state}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {selectedCase && (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Report Preview Info</p>
              {[
                { label: 'Case ID', value: selectedCase.caseId },
                { label: 'Name', value: selectedCase.name },
                { label: 'Age/Gender', value: `${selectedCase.age} yrs / ${selectedCase.gender}` },
                { label: 'Last Seen', value: selectedCase.lastSeenLocation },
                { label: 'Status', value: getStatusLabel(selectedCase.status) },
                { label: 'Missing', value: `${calculateDaysMissing(selectedCase.lastSeenDate)} days` },
              ].map(({ label, value }) => (
                <div key={label} className="flex gap-3 text-sm">
                  <span className="text-gray-400 w-24 flex-shrink-0">{label}</span>
                  <span className="text-gray-900 font-medium">{value}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={handlePrint} disabled={!selectedCase || generating}
              className="btn-primary flex-1 flex items-center justify-center gap-2">
              <Printer size={16} /> Print / PDF
            </button>
            <button onClick={handleDownload} disabled={!selectedCase || generating}
              className="btn-secondary flex items-center gap-2 px-4">
              <Download size={16} /> Download
            </button>
          </div>

          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-xs text-blue-700">
              <strong>How to save as PDF:</strong> Click "Print / PDF" → In print dialog,
              select <strong>"Save as PDF"</strong> as printer → Save
            </p>
          </div>
        </div>

        {/* Preview */}
        <div className="card p-5">
          <h3 className="font-bold text-gray-800 mb-4">Report Preview</h3>
          {selectedCase ? (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
              {/* Mini preview */}
              <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">FT</div>
                <div>
                  <p className="text-xs font-bold text-gray-700">FindThem India</p>
                  <p className="text-[10px] text-gray-400">Official Missing Person Report</p>
                </div>
                <span className="ml-auto text-xs font-mono text-orange-600 font-bold">{selectedCase.caseId}</span>
              </div>
              <div className="flex gap-3">
                <img
                  src={selectedCase.photos?.[0] || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedCase.name)}&size=200&background=f97316&color=fff`}
                  alt={selectedCase.name}
                  className="w-20 h-24 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                  onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedCase.name)}&size=200&background=f97316&color=fff`; }}
                />
                <div className="space-y-1">
                  <p className="font-bold text-gray-900 text-sm">{selectedCase.name}</p>
                  <p className="text-xs text-gray-500">{selectedCase.age} yrs • {selectedCase.gender}</p>
                  <p className="text-xs text-gray-500">{selectedCase.lastSeenLocation}</p>
                  <p className="text-xs text-red-600 font-semibold">Missing {calculateDaysMissing(selectedCase.lastSeenDate)} days</p>
                  <p className="text-xs text-gray-500">📞 {selectedCase.contactPhone}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-gray-200 flex justify-between text-[10px] text-gray-400">
                <span>findthemindia.vercel.app</span>
                <span>OFFICIAL DOCUMENT</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <FileText size={32} className="text-gray-200 mb-3" />
              <p className="text-gray-400 text-sm">Select a case to preview report</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}