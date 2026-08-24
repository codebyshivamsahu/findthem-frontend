// src/pages/verify-email.tsx
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Shield, CheckCircle, XCircle } from 'lucide-react';
import { api } from '@/lib/api';

type State = 'checking' | 'done' | 'failed';

export default function VerifyEmail() {
  const router = useRouter();
  const [state, setState] = useState<State>('checking');
  const [message, setMessage] = useState('');
  const attempted = useRef(false);

  useEffect(() => {
    if (!router.isReady || attempted.current) return;
    const token = router.query.token;
    if (typeof token !== 'string' || !token) {
      setState('failed');
      setMessage('This link is incomplete. Open the confirmation link from your email again.');
      return;
    }
    // The token is single-use, so guard against React running this twice.
    attempted.current = true;

    api.auth.verifyEmail(token)
      .then(() => setState('done'))
      .catch((err: any) => {
        setState('failed');
        setMessage(err?.message || 'Could not confirm this email address.');
      });
  }, [router.isReady, router.query.token]);

  return (
    <>
      <Head><title>Confirm email — Find Them India</title></Head>
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-orange-50/60 to-white">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="text-white" size={30} />
            </div>
            <h1 className="section-title text-3xl">Find Them India</h1>
          </div>

          <div className="card p-7 text-center">
            {state === 'checking' && (
              <>
                <div className="w-10 h-10 mx-auto mb-4 rounded-full border-2 border-orange-200 border-t-orange-600 animate-spin" />
                <p className="text-sm text-gray-500">Confirming your email…</p>
              </>
            )}

            {state === 'done' && (
              <>
                <CheckCircle className="text-green-600 mx-auto mb-3" size={40} />
                <p className="font-bold text-gray-900">Email confirmed</p>
                <p className="text-sm text-gray-500 mt-1 mb-5">Thanks — your address is verified.</p>
                <button onClick={() => router.push('/')} className="btn-primary w-full">Continue</button>
              </>
            )}

            {state === 'failed' && (
              <>
                <XCircle className="text-gray-400 mx-auto mb-3" size={40} />
                <p className="font-bold text-gray-900">Couldn&apos;t confirm this link</p>
                <p className="text-sm text-gray-500 mt-1 mb-5">{message}</p>
                <button onClick={() => router.push('/')} className="btn-secondary w-full">Back to sign in</button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
