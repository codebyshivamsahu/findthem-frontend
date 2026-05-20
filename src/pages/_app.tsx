// src/pages/_app.tsx
import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAppStore } from '@/store';
import '@/styles/globals.css';

function AppInit() {
  const restoreSession = useAppStore(s => s.restoreSession);
  useEffect(() => {
    restoreSession();
  }, []);
  return null;
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <AppInit />
      <Component {...pageProps} />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            borderRadius: '12px',
          },
          success: { iconTheme: { primary: '#059669', secondary: '#fff' } },
          error: { iconTheme: { primary: '#DC2626', secondary: '#fff' } },
        }}
      />
    </>
  );
}