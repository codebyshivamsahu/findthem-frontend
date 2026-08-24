// src/pages/reset-password.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Shield, Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';

export default function ResetPassword() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!router.isReady) return;
    const t = router.query.token;
    setToken(typeof t === 'string' ? t : '');
  }, [router.isReady, router.query.token]);

  const handleSubmit = async () => {
    setError('');
    if (password.length < 8) return setError('Password must be at least 8 characters');
    if (password !== confirm) return setError('The two passwords do not match');

    setSubmitting(true);
    try {
      await api.auth.resetPassword(token, password);
      setDone(true);
    } catch (err: any) {
      setError(err?.message || 'Could not reset the password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head><title>Reset password — Find Them India</title></Head>
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-orange-50/60 to-white">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="text-white" size={30} />
            </div>
            <h1 className="section-title text-3xl">Find Them India</h1>
            <p className="text-gray-500 text-sm mt-1">Choose a new password</p>
          </div>

          <div className="card p-6">
            {done ? (
              <div className="text-center py-4">
                <CheckCircle className="text-green-600 mx-auto mb-3" size={40} />
                <p className="font-bold text-gray-900">Password updated</p>
                <p className="text-sm text-gray-500 mt-1 mb-5">You can sign in with your new password now.</p>
                <button onClick={() => router.push('/')} className="btn-primary w-full">Go to sign in</button>
              </div>
            ) : !token ? (
              <div className="text-center py-4">
                <p className="font-bold text-gray-900">This link is incomplete</p>
                <p className="text-sm text-gray-500 mt-1 mb-5">
                  Open the reset link from your email again, or request a new one.
                </p>
                <button onClick={() => router.push('/')} className="btn-secondary w-full">Back to sign in</button>
              </div>
            ) : (
              <>
                <label className="label">New password</label>
                <div className="relative mb-4">
                  <input className="input pr-10" type={showPass ? 'text' : 'password'}
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="At least 8 characters" />
                  <button type="button" onClick={() => setShowPass(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <label className="label">Confirm new password</label>
                <input className="input mb-4" type={showPass ? 'text' : 'password'}
                  value={confirm} onChange={e => setConfirm(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  placeholder="Type it again" />

                {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

                <button onClick={handleSubmit} disabled={submitting || !password || !confirm}
                  className="btn-primary w-full">
                  {submitting ? 'Updating…' : 'Update password'}
                </button>

                <button onClick={() => router.push('/')}
                  className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1.5">
                  <ArrowLeft size={14} /> Back to sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
