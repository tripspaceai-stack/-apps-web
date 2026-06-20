'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </h1>
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
  );
}
