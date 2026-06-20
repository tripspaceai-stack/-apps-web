'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

interface Props {
  tripId: string;
  initialWorkspace: Workspace;
  slug: string;
}

export default function GuestWorkspaceClient({ tripId, initialWorkspace, slug }: Props) {
  const [workspace, setWorkspace] = useState<Workspace>(initialWorkspace);
  const [updated, setUpdated] = useState(false);
  const [activeDay, setActiveDay] = useState(0);

  useEffect(() => {
    const channel = supabase
      .channel(`trip-${tripId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'trips', filter: `id=eq.${tripId}` },
        (payload) => {
          const newWorkspace = (payload.new as { workspace_json: Workspace }).workspace_json;
          if (newWorkspace) {
            setWorkspace(newWorkspace);
            setUpdated(true);
            setTimeout(() => setUpdated(false), 3000);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tripId]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-5">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{workspace.title}</h1>
            <p className="text-gray-500 mt-1">{workspace.summary}</p>
          </div>
          {updated && (
            <span className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-medium animate-pulse">
              ✓ Updated live
            </span>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6">
        {/* Hotel */}
        {workspace.hotels.length > 0 && (
          <div className="bg-white rounded-2xl p-5 mb-6 shadow-sm">
            <h2 className="font-semibold text-gray-400 text-xs uppercase tracking-wide mb-3">Accommodation</h2>
            {workspace.hotels.map((h, i) => (
              <div key={i}>
                <p className="font-bold text-lg">{h.name}</p>
                <p className="text-gray-500 text-sm">{h.address}</p>
                <p className="text-gray-400 text-sm mt-1">Check-in: {h.checkIn} · Check-out: {h.checkOut}</p>
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
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <h2 className="font-bold text-lg mb-1">Day {workspace.days[activeDay].day} — {workspace.days[activeDay].theme}</h2>
            <p className="text-gray-400 text-sm mb-4">{workspace.days[activeDay].date}</p>
            <div className="space-y-4">
              {workspace.days[activeDay].activities.map((a, j) => (
                <div key={j} className="flex gap-4">
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
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
            <h2 className="font-semibold text-gray-400 text-xs uppercase tracking-wide mb-3">Travel Tips</h2>
            <ul className="space-y-2">
              {workspace.tips.map((t, i) => (
                <li key={i} className="text-sm text-gray-600 flex gap-2">
                  <span className="text-yellow-500 shrink-0">💡</span>{t}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CTA */}
        <div className="text-center py-8 border-t">
          <p className="text-gray-400 text-sm mb-3">Want to plan your own trip?</p>
          <a href="/auth" className="inline-block bg-black text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800">
            Create your own trip ✈️
          </a>
        </div>
      </div>
    </div>
  );
}
