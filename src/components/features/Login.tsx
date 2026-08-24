// src/components/features/Login.tsx
import { useState } from 'react';
import { useAppStore } from '@/store';
import { api, saveToken } from '@/lib/api';
import { Shield, Eye, EyeOff, LogIn, UserPlus, Phone, MapPin, Users, ArrowLeft } from 'lucide-react';
import { INDIAN_STATES } from '@/lib/mockData';
import toast from 'react-hot-toast';

type Mode = 'login' | 'signup' | 'forgot';
// Only self-service roles are listed. Police / admin accounts are created by
// an existing admin after verification — the backend ignores any role sent
// from the client, so adding them back here would do nothing anyway.
const ROLES = [
  { value: 'volunteer', label: 'Volunteer', desc: 'Help search & report sightings' },
  { value: 'ngo', label: 'NGO Worker', desc: 'Organization working on cases' },
];

export default function Login() {
  const { login, setUser, fetchCases } = useAppStore();
  const [mode, setMode] = useState<Mode>('login');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signupStep, setSignupStep] = useState(1);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [signupForm, setSignupForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    phone: '', role: 'volunteer', state: '', district: '',
  });

  const updateLogin = (k: string, v: string) => setLoginForm(f => ({ ...f, [k]: v }));
  const updateSignup = (k: string, v: string) => setSignupForm(f => ({ ...f, [k]: v }));

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) { toast.error('Please fill all fields'); return; }
    setLoading(true);
    const ok = await login(loginForm.email, loginForm.password);
    setLoading(false);
    if (ok) toast.success('Welcome back!');
    else toast.error('Invalid email or password');
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) { toast.error('Enter your email address'); return; }
    setLoading(true);
    try {
      await api.auth.forgotPassword(forgotEmail);
      // The API answers the same way whether or not the account exists, so that
      // this form can't be used to find out who is registered. Say the same here.
      setForgotSent(true);
    } catch {
      setForgotSent(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSignupNext = () => {
    if (!signupForm.name || !signupForm.email || !signupForm.password) { toast.error('Name, email and password are required'); return; }
    if (signupForm.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (signupForm.password !== signupForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    setSignupStep(2);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupForm.state) { toast.error('Please select your state'); return; }
    setLoading(true);
    try {
      const res = await api.auth.register({
        name: signupForm.name, email: signupForm.email, password: signupForm.password,
        // `role` is intentionally not sent — the API assigns it, and would strip
        // it anyway. The picker below only records the user's stated intent.
        phone: signupForm.phone, state: signupForm.state, district: signupForm.district,
      }) as any;
      if (res.success && res.data) {
        saveToken(res.data.token);
        setUser(res.data.user);
        await fetchCases();
        toast.success(`Welcome ${res.data.user.name}! Account created successfully.`);
      } else { toast.error(res.message || 'Registration failed'); }
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-200 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-200 rounded-full blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-7">
          <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-200">
            <Shield size={30} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>Find Them India</h1>
          <p className="text-gray-500 mt-1 text-sm">National Missing Persons Platform</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="h-px w-10 bg-orange-200" />
            <span className="text-xs text-orange-500 font-semibold tracking-widest uppercase">Secure Portal</span>
            <div className="h-px w-10 bg-orange-200" />
          </div>
        </div>

        <div className="bg-gray-100 rounded-2xl p-1 flex mb-5">
          <button onClick={() => { setMode('login'); setSignupStep(1); }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${mode === 'login' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            <LogIn size={15} /> Sign In
          </button>
          <button onClick={() => { setMode('signup'); setSignupStep(1); }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${mode === 'signup' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            <UserPlus size={15} /> Sign Up
          </button>
        </div>

        {mode === 'login' && (
          <div className="card p-7 shadow-xl border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Sign in to your account</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="label">Email Address</label>
                <input type="email" className="input" required placeholder="your@email.com" value={loginForm.email} onChange={e => updateLogin('email', e.target.value)} />
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} className="input pr-11" required placeholder="••••••••" value={loginForm.password} onChange={e => updateLogin('password', e.target.value)} />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full h-12 flex items-center justify-center gap-2 text-base mt-2">
                {loading ? (<><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg> Signing in...</>) : <><LogIn size={18} /> Sign In</>}
              </button>
            </form>

            <button type="button" onClick={() => { setMode('forgot'); setForgotEmail(loginForm.email); setForgotSent(false); }}
              className="w-full mt-4 text-sm text-gray-500 hover:text-orange-600 transition-colors">
              Forgot your password?
            </button>
          </div>
        )}

        {mode === 'forgot' && (
          <div className="card p-7 shadow-xl border-gray-100">
            {forgotSent ? (
              <div className="text-center py-2">
                <h2 className="text-lg font-bold text-gray-900 mb-2">Check your email</h2>
                <p className="text-sm text-gray-500 mb-6">
                  If an account exists for <strong>{forgotEmail}</strong>, a reset link is on its way.
                  It expires in an hour. Check your spam folder if it doesn&apos;t arrive.
                </p>
                <button onClick={() => setMode('login')} className="btn-secondary w-full">Back to sign in</button>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Reset your password</h2>
                <p className="text-sm text-gray-500 mb-5">
                  Enter the email you signed up with and we&apos;ll send you a link to set a new password.
                </p>
                <form onSubmit={handleForgot} className="space-y-4">
                  <div>
                    <label className="label">Email Address</label>
                    <input type="email" className="input" required placeholder="your@email.com"
                      value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} />
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full h-12 text-base">
                    {loading ? 'Sending…' : 'Send reset link'}
                  </button>
                </form>
                <button type="button" onClick={() => setMode('login')}
                  className="w-full mt-4 text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1.5">
                  <ArrowLeft size={14} /> Back to sign in
                </button>
              </>
            )}
          </div>
        )}

        {mode === 'signup' && (
          <div className="card p-7 shadow-xl border-gray-100">
            <div className="flex items-center gap-2 mb-5">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${signupStep >= 1 ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
              <div className={`flex-1 h-0.5 ${signupStep >= 2 ? 'bg-orange-400' : 'bg-gray-200'}`} />
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${signupStep >= 2 ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
            </div>

            {signupStep === 1 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-900">Create your account</h2>
                <div><label className="label">Full Name *</label><input className="input" placeholder="Your full name" value={signupForm.name} onChange={e => updateSignup('name', e.target.value)} /></div>
                <div><label className="label">Email Address *</label><input type="email" className="input" placeholder="your@email.com" value={signupForm.email} onChange={e => updateSignup('email', e.target.value)} /></div>
                <div>
                  <label className="label">Password *</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} className="input pr-11" placeholder="At least 6 characters" value={signupForm.password} onChange={e => updateSignup('password', e.target.value)} />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><EyeOff size={16} /></button>
                  </div>
                </div>
                <div><label className="label">Confirm Password *</label><input type="password" className="input" placeholder="Re-enter password" value={signupForm.confirmPassword} onChange={e => updateSignup('confirmPassword', e.target.value)} />
                  {signupForm.confirmPassword && signupForm.password !== signupForm.confirmPassword && <p className="text-xs text-red-500 mt-1">Passwords do not match</p>}
                </div>
                <button type="button" onClick={handleSignupNext} className="btn-primary w-full h-11">Next →</button>
              </div>
            )}

            {signupStep === 2 && (
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <button type="button" onClick={() => setSignupStep(1)} className="text-gray-400 hover:text-gray-600"><ArrowLeft size={16} /></button>
                  <h2 className="text-lg font-bold text-gray-900">Additional Details</h2>
                </div>
                <div><label className="label">Phone Number</label><div className="relative"><Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="input pl-9" type="tel" placeholder="+91 XXXXX XXXXX" value={signupForm.phone} onChange={e => updateSignup('phone', e.target.value)} /></div></div>
                <div>
                  <label className="label flex items-center gap-1.5"><Users size={13} /> Role *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ROLES.map(r => (
                      <button key={r.value} type="button" onClick={() => updateSignup('role', r.value)}
                        className={`p-3 rounded-xl border text-left transition-all ${signupForm.role === r.value ? 'border-orange-400 bg-orange-50 ring-1 ring-orange-300' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                        <p className={`text-xs font-bold ${signupForm.role === r.value ? 'text-orange-700' : 'text-gray-700'}`}>{r.label}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{r.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label flex items-center gap-1"><MapPin size={12} /> State *</label>
                    <select className="input text-sm" value={signupForm.state} onChange={e => updateSignup('state', e.target.value)}>
                      <option value="">Select state</option>
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div><label className="label">District</label><input className="input" placeholder="District" value={signupForm.district} onChange={e => updateSignup('district', e.target.value)} /></div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full h-11 flex items-center justify-center gap-2">
                  {loading ? (<><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg> Creating...</>) : <><UserPlus size={16} /> Create Account</>}
                </button>
              </form>
            )}
          </div>
        )}

        <div className="text-center mt-5">
          <p className="text-xs text-gray-400">An independent community platform</p>
          <p className="text-xs text-gray-300">Not affiliated with any government body or police force</p>
        </div>
      </div>
    </div>
  );
}