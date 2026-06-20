'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';

interface Activity {
  name: string;
  description: string;
  address: string;
  startTime: string;
  duration: number;
}

interface Day {
  day: number;
  date: string;
  theme: string;
  activities: Activity[];
}

interface Hotel {
  name: string;
  address: string;
  checkIn: string;
  checkOut: string;
  notes: string;
}

interface Workspace {
  title: string;
  summary: string;
  days: Day[];
  hotels: Hotel[];
  tips: string[];
}

interface Trip {
  id: string;
  title: string;
  status: string;
  slug: string;
  share_token: string;
  workspace_json: Workspace | null;
}

export default function EditTrip() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [activeDay, setActiveDay] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) { router.push('/auth'); return; }
    fetchTrip();
  }, [id]);

  async function fetchTrip() {
    const data = await apiRequest(`/trips/${id}`);
    if (data.error) { router.push('/admin/dashboard'); return; }
    setTrip(data);
    setLoading(false);

    // Poll until live
    if (data.status === 'generating') {
      setTimeout(fetchTrip, 3000);
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">✈️</div>
        <p className="text-gray-500 text-lg">Loading your trip...</p>
      </div>
    </div>
  );

  if (trip?.status === 'generating') return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-bounce">🗺️</div>
        <p className="text-xl font-semibold mb-2">Building your itinerary...</p>
        <p className="text-gray-400">This takes about 30 seconds</p>
        <div className="mt-6 w-48 mx-auto bg-gray-200 rounded-full h-2">
          <div className="bg-black h-2 rounded-full animate-pulse w-2/3" />
        </div>
      </div>
    </div>
  );

  if (trip?.status === 'failed') return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-xl font-semibold mb-2">Generation failed</p>
        <button onClick={() => router.push('/admin/new')} className="mt-4 bg-black text-white px-6 py-2 rounded-xl">Try again</button>
      </div>
    </div>
  );

  const workspace = trip?.workspace_json;
  if (!workspace) return null;

  const shareUrl = `${window.location.origin}/${trip.slug}?token=${trip.share_token}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{workspace.title}</h1>
          <p className="text-sm text-gray-400">{workspace.summary}</p>
        </div>
        <button onClick={() => { navigator.clipboard.writeText(shareUrl); alert('Share link copied!'); }}
          className="bg-black text-white px-4 py-2 rounded-xl text-sm font-medium">
          Share link 🔗
        </button>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Hotel */}
        {workspace.hotels.length > 0 && (
          <div className="bg-white rounded-2xl p-5 mb-6 shadow-sm">
            <h2 className="font-semibold text-gray-500 text-xs uppercase tracking-wide mb-3">Accommodation</h2>
            {workspace.hotels.map((h, i) => (
              <div key={i}>
                <p className="font-bold text-lg">{h.name}</p>
                <p className="text-gray-500 text-sm">{h.address}</p>
                <p className="text-gray-400 text-sm mt-1">Check-in: {h.checkIn} · Check-out: {h.checkOut}</p>
                {h.notes && <p className="text-gray-500 text-sm mt-2 italic">{h.notes}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Day tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {workspace.days.map((d, i) => (
            <button key={i} onClick={() => setActiveDay(i)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${activeDay === i ? 'bg-black text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
              Day {d.day}
            </button>
          ))}
        </div>

        {/* Active day */}
        {workspace.days[activeDay] && (
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
            <h2 className="font-bold text-lg mb-1">Day {workspace.days[activeDay].day} — {workspace.days[activeDay].theme}</h2>
            <p className="text-gray-400 text-sm mb-4">{workspace.days[activeDay].date}</p>
            <div className="space-y-4">
              {workspace.days[activeDay].activities.map((a, i) => (
                <div key={i} className="flex gap-4">
                  <div className="text-sm text-gray-400 w-14 pt-1 shrink-0">{a.startTime}</div>
                  <div className="flex-1 border-l pl-4">
                    <p className="font-semibold">{a.name}</p>
                    <p className="text-gray-500 text-sm mt-0.5">{a.description}</p>
                    <p className="text-gray-400 text-xs mt-1">📍 {a.address} · {a.duration} min</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        {workspace.tips.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="font-semibold text-gray-500 text-xs uppercase tracking-wide mb-3">Travel Tips</h2>
            <ul className="space-y-2">
              {workspace.tips.map((t, i) => (
                <li key={i} className="text-sm text-gray-600 flex gap-2">
                  <span className="text-yellow-500 shrink-0">💡</span>{t}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
