const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  if (data.accessToken) {
    localStorage.setItem('accessToken', data.accessToken);
    return data.accessToken;
  }
  return null;
}

export async function apiRequest(path: string, options: RequestInit = {}): Promise<unknown> {
  let token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  const makeRequest = (t: string | null) =>
    fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
        ...options.headers,
      },
    });

  let res = await makeRequest(token);

  // Auto-refresh on 401
  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await makeRequest(newToken);
    } else {
      // Refresh failed — redirect to login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/auth';
      return {};
    }
  }

  return res.json();
}
