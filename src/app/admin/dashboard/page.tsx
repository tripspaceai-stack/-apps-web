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
}

export default function Dashboard() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) { router.push('/auth'); return; }
    apiRequest('/trips').then(data => {
      if (Array.isArray(data)) setTrips(data);
      setLoading(false);
    });
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">My Trips</h1>
          <Link href="/admin/new"
            className="bg-black text-white px-4 py-2 rounded-xl font-medium hover:bg-gray-800">
            + New Trip
          </Link>
        </div>

        {loading && <p className="text-gray-400 text-center py-20">Loading...</p>}

        {!loading && trips.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🗺️</div>
            <p className="text-gray-400 text-lg">No trips yet. Create your first one!</p>
            <Link href="/admin/new" className="inline-block mt-4 bg-black text-white px-6 py-3 rounded-xl font-medium">
              Plan a trip
            </Link>
          </div>
        )}

        <div className="grid gap-4">
          {trips.map(trip => (
            <Link key={trip.id} href={`/admin/${trip.id}/edit`}
              className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg">{trip.title}</h2>
                <p className="text-gray-400 text-sm mt-1">
                  {trip.destination} · {trip.start_date ? new Date(trip.start_date).toLocaleDateString() : 'No date'}
                  {trip.end_date ? ` – ${new Date(trip.end_date).toLocaleDateString()}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                  trip.status === 'live' ? 'bg-green-100 text-green-700' :
                  trip.status === 'generating' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {trip.status}
                </span>
                <span className="text-gray-300">→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
