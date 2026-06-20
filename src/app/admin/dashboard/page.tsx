'use client';
import { useEffect, useState } from 'react';
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

export default function Dashboard() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) { router.push('/auth'); return; }
    apiRequest('/trips').then(data => {
      if (Array.isArray(data)) setTrips(data as Trip[]);
      setLoading(false);
    });
  }, [router]);

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
          {!showArchived && (
            <Link href="/admin/new" className="bg-black text-white px-4 py-2 rounded-xl font-medium hover:bg-gray-800">
              + New Trip
            </Link>
          )}
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
