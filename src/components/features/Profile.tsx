// src/components/features/Profile.tsx
import { useState } from 'react';
import { useAppStore } from '@/store';
import { INDIAN_STATES } from '@/lib/mockData';
import { UserCircle, Mail, Phone, MapPin, Shield, Edit2, Save, LogOut, X, Key, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

const ROLE_COLORS: Record<string, string> = {
  admin:     'bg-red-50 text-red-700 border-red-200',
  police:    'bg-blue-50 text-blue-700 border-blue-200',
  ngo:       'bg-green-50 text-green-700 border-green-200',
  volunteer: 'bg-orange-50 text-orange-700 border-orange-200',
};

export default function Profile() {
  const { currentUser, logout, setUser } = useAppStore();
  const [editing, setEditing]       = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [resending, setResending] = useState(false);

  // This used to just show a success toast without calling anything — the
  // password never actually changed.
  const handleChangePassword = async () => {
    if (pwForm.newPw.length < 8) { toast.error('New password must be at least 8 characters'); return; }
    if (pwForm.newPw !== pwForm.confirm) { toast.error('The two passwords do not match'); return; }
    setSavingPw(true);
    try {
      await api.auth.changePassword(pwForm.current, pwForm.newPw);
      toast.success('Password updated');
      setChangingPw(false);
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch (err: any) {
      toast.error(err?.message || 'Could not update the password');
    } finally {
      setSavingPw(false);
    }
  };

  const handleResendVerification = async () => {
    setResending(true);
    try {
      const res: any = await api.auth.resendVerification();
      toast.success(res?.message || 'Confirmation email sent');
    } catch (err: any) {
      toast.error(err?.message || 'Could not send the email');
    } finally {
      setResending(false);
    }
  };
  const [saving, setSaving]         = useState(false);
  const [form, setForm] = useState({ name: currentUser?.name || '', phone: currentUser?.phone || '', state: currentUser?.state || '', district: currentUser?.district || '' });
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });

  const handleSave = async () => {
    if (!form.name) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      toast.success('Profile updated successfully!');
      setUser({ ...currentUser!, ...form });
      setEditing(false);
    } catch { toast.error('Update failed');
    } finally { setSaving(false); }
  };

  if (!currentUser) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h2 className="section-title text-lg">My Profile</h2>

      <div className="card p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-100">
              <span className="text-white text-2xl font-bold">{currentUser.name.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{currentUser.name}</h3>
              <p className="text-sm text-gray-400">{currentUser.email}</p>
              <span className={`mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize ${ROLE_COLORS[currentUser.role] || ROLE_COLORS.volunteer}`}>
                <Shield size={10} /> {currentUser.role}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {!editing ? (
              <button onClick={() => setEditing(true)} className="btn-secondary flex items-center gap-1.5 text-sm py-2"><Edit2 size={14} /> Edit</button>
            ) : (
              <>
                <button onClick={() => setEditing(false)} className="btn-secondary flex items-center gap-1.5 text-sm py-2"><X size={14} /> Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-1.5 text-sm py-2"><Save size={14} /> {saving ? 'Saving...' : 'Save'}</button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {[
            { icon: UserCircle, label: 'Full Name', key: 'name', value: currentUser.name, editable: true, placeholder: 'Your full name' },
            { icon: Mail,       label: 'Email',     key: 'email', value: currentUser.email, editable: false },
            { icon: Phone,      label: 'Phone',     key: 'phone', value: currentUser.phone || '—', editable: true, placeholder: '+91 XXXXX XXXXX' },
          ].map(({ icon: Icon, label, key, value, editable, placeholder }) => (
            <div key={key} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
              <Icon size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                {editing && editable ? (
                  <input className="input py-2 text-sm" value={(form as any)[key] || ''} placeholder={placeholder}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                ) : (
                  <p className="text-sm font-medium text-gray-900">{value}</p>
                )}
                {!editable && <p className="text-[11px] text-gray-400 mt-0.5">Cannot be changed</p>}
              </div>
            </div>
          ))}

          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
            <MapPin size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Location</p>
              {editing ? (
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <select className="input py-2 text-sm" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))}>
                    <option value="">Select State</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <input className="input py-2 text-sm" placeholder="District" value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} />
                </div>
              ) : (
                <p className="text-sm font-medium text-gray-900">{[currentUser.district, currentUser.state].filter(Boolean).join(', ') || '—'}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2"><Key size={16} className="text-gray-500" /><h3 className="font-bold text-gray-800">Change Password</h3></div>
          <button onClick={() => setChangingPw(!changingPw)} className="text-sm text-orange-600 hover:text-orange-700 font-semibold">{changingPw ? 'Cancel' : 'Change Password'}</button>
        </div>
        {changingPw && (
          <div className="space-y-3">
            <input type="password" className="input" placeholder="Current password" value={pwForm.current} onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} />
            <input type="password" className="input" placeholder="New password (min 6 characters)" value={pwForm.newPw} onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))} />
            <input type="password" className="input" placeholder="Confirm new password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} />
            {pwForm.confirm && pwForm.newPw !== pwForm.confirm && <p className="text-xs text-red-500">Passwords do not match</p>}
            <button className="btn-primary text-sm" disabled={savingPw || !pwForm.current || !pwForm.newPw || pwForm.newPw !== pwForm.confirm}
              onClick={handleChangePassword}>{savingPw ? 'Updating…' : 'Update Password'}</button>
          </div>
        )}
      </div>

      {!currentUser.verified && (
        <div className="card p-4 border-yellow-200 bg-yellow-50/60">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-yellow-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">Email not confirmed</p>
              <p className="text-xs text-gray-600 mt-0.5 mb-2">
                We sent a confirmation link to {currentUser.email} when you signed up.
              </p>
              <button onClick={handleResendVerification} disabled={resending}
                className="text-xs font-semibold text-orange-600 hover:text-orange-700 disabled:opacity-50">
                {resending ? 'Sending…' : 'Send it again'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card p-6">
        <h3 className="font-bold text-gray-800 mb-4">Account Information</h3>
        <div className="space-y-3">
          {[
            { label: 'Account Type',        value: currentUser.role,                               bold: true },
            { label: 'User ID',             value: `${currentUser.id?.slice(0, 8)}...`,            mono: true },
          ].map(({ label, value, mono }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-gray-400">{label}</span>
              <span className={`font-semibold capitalize text-gray-800 ${mono ? 'font-mono text-xs text-gray-500' : ''}`}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-4">
        <button onClick={() => { logout(); toast.success('Logged out successfully'); }}
          className="w-full flex items-center justify-center gap-2 text-red-600 hover:text-red-700 font-semibold text-sm py-2 hover:bg-red-50 rounded-xl transition-colors">
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  );
}
