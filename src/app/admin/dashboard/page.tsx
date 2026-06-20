'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';

interface Trip {
  id: string;
  title: string;
  destination: string;
  status: string;
  start_date: string;
  end_date: string;
  created_at: string;
  archived: boolean;
}

interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  account_type: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) { router.push('/auth'); return; }
    apiRequest('/trips').then(data => {
      if (Array.isArray(data)) setTrips(data as Trip[]);
      setLoading(false);
    });
    apiRequest('/auth/me').then(data => {
      if (data && (data as User).email) setUser(data as User);
    });
  }, [router]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    router.push('/auth');
  }

  async function toggleArchive(trip: Trip, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const newArchived = !trip.archived;
    await apiRequest(`/trips/${trip.id}/archive`, {
      method: 'PATCH',
      body: JSON.stringify({ archived: newArchived }),
    });
    setTrips(prev => prev.map(t => t.id === trip.id ? { ...t, archived: newArchived } : t));
  }

  async function deleteTrip(trip: Trip, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete "${trip.title}"? This cannot be undone.`)) return;
    await apiRequest(`/trips/${trip.id}`, { method: 'DELETE' });
    setTrips(prev => prev.filter(t => t.id !== trip.id));
  }

  const visible = trips.filter(t => showArchived ? t.archived : !t.archived);
  const initials = user?.name ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">My Trips</h1>
            <button onClick={() => setShowArchived(v => !v)}
              className={`text-sm px-3 py-1.5 rounded-lg border transition ${showArchived ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}>
              {showArchived ? '← Active trips' : '🗄 Archived'}
            </button>
          </div>
          <div className="flex items-center gap-3">
            {!showArchived && (
              <Link href="/admin/new" className="bg-black text-white px-4 py-2 rounded-xl font-medium hover:bg-gray-800">
                + New Trip
              </Link>
            )}
            {/* Profile avatar */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfile(v => !v)}
                className="w-9 h-9 rounded-full bg-gray-800 text-white text-sm font-semibold flex items-center justify-center hover:bg-gray-700 transition">
                {initials}
              </button>
              {showProfile && (
                <div className="absolute right-0 top-11 w-64 bg-white rounded-2xl shadow-lg border border-gray-100 p-4 z-50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gray-800 text-white text-sm font-semibold flex items-center justify-center shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{user?.name || '—'}</p>
                      <p className="text-gray-400 text-xs truncate">{user?.email}</p>
                    </div>
                  </div>
                  <div className="border-t border-gray-100 pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Account</span>
                      <span className="font-medium">{user?.account_type}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Member since</span>
                      <span className="font-medium">
                        {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Trips</span>
                      <span className="font-medium">{trips.length}</span>
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    className="mt-4 w-full text-sm text-red-500 hover:text-red-700 border border-red-100 hover:border-red-300 rounded-xl py-2 transition">
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {loading && <p className="text-gray-400 text-center py-20">Loading...</p>}

        {!loading && visible.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">{showArchived ? '🗄️' : '🗺️'}</div>
            <p className="text-gray-400 text-lg">
              {showArchived ? 'No archived trips.' : 'No trips yet. Create your first one!'}
            </p>
            {!showArchived && (
              <Link href="/admin/new" className="inline-block mt-4 bg-black text-white px-6 py-3 rounded-xl font-medium">
                Plan a trip
              </Link>
            )}
          </div>
        )}

        <div className="grid gap-4">
          {visible.map(trip => (
            <Link key={trip.id} href={`/admin/${trip.id}/edit`}
              className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition flex items-center justify-between group">
              <div className="min-w-0 flex-1">
                <h2 className={`font-bold text-lg ${trip.archived ? 'text-gray-400' : ''}`}>{trip.title}</h2>
                <p className="text-gray-400 text-sm mt-1">
                  {trip.destination} · {trip.start_date ? new Date(trip.start_date).toLocaleDateString() : 'No date'}
                  {trip.end_date ? ` – ${new Date(trip.end_date).toLocaleDateString()}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-4">
                {!trip.archived && (
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    trip.status === 'live' ? 'bg-green-100 text-green-700' :
                    trip.status === 'generating' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {trip.status}
                  </span>
                )}
                <button
                  onClick={e => toggleArchive(trip, e)}
                  className="opacity-0 group-hover:opacity-100 transition text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700 bg-white">
                  {trip.archived ? 'Restore' : 'Archive'}
                </button>
                <button
                  onClick={e => deleteTrip(trip, e)}
                  className="opacity-0 group-hover:opacity-100 transition text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-400 hover:bg-red-50 hover:text-red-600 bg-white">
                  Delete
                </button>
                <span className="text-gray-300">→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
