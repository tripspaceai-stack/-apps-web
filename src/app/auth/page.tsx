'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { apiRequest } from '@/lib/api';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          renderButton: (element: HTMLElement, config: object) => void;
        };
      };
    };
  }
}

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function initGoogle() {
    if (!window.google) return;
    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
    });
    const btn = document.getElementById('google-signin-btn');
    if (btn) {
      window.google.accounts.id.renderButton(btn, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        width: 400,
        text: 'continue_with',
      });
    }
  }

  useEffect(() => {
    // Re-render button when mode changes (element may re-mount)
    const timer = setTimeout(initGoogle, 50);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  async function handleGoogleCredential(response: { credential: string }) {
    setError('');
    setLoading(true);
    try {
      const data = await apiRequest('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential: response.credential }),
      }) as { error?: string; accessToken: string; refreshToken: string };
      if (data.error) { setError(data.error); return; }
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      router.push('/admin/dashboard');
    } catch (e) {
      setError('Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const body = mode === 'signup' ? { email, password, name } : { email, password };
    const data = await apiRequest(`/auth/${mode}`, { method: 'POST', body: JSON.stringify(body) }) as { error?: string; accessToken: string; refreshToken: string };
    setLoading(false);
    if (data.error) { setError(data.error); return; }
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    router.push('/admin/dashboard');
  }

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" onLoad={initGoogle} />
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-center">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>

          {/* Google Sign-In */}
          <div id="google-signin-btn" className="flex justify-center mb-4" />

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <input className="w-full border rounded-lg px-4 py-2" placeholder="Name"
                value={name} onChange={e => setName(e.target.value)} />
            )}
            <input className="w-full border rounded-lg px-4 py-2" placeholder="Email" type="email"
              value={email} onChange={e => setEmail(e.target.value)} required />
            <input className="w-full border rounded-lg px-4 py-2" placeholder="Password" type="password"
              value={password} onChange={e => setPassword(e.target.value)} required />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-black text-white py-2 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50">
              {loading ? 'Loading...' : mode === 'login' ? 'Sign in' : 'Sign up'}
            </button>
          </form>
          <p className="text-center text-sm mt-4 text-gray-500">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button className="text-black font-medium" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </>
  );
}
