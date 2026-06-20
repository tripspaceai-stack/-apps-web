import { notFound } from 'next/navigation';

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
  slug: string;
  share_token: string;
  status: string;
  workspace_json: Workspace | null;
}

async function getTrip(slug: string, token: string): Promise<Trip | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/trips/public/${slug}?token=${token}`,
      { cache: 'no-store' }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function GuestWorkspace({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { slug } = await params;
  const { token } = await searchParams;

  if (!token) notFound();

  const trip = await getTrip(slug, token);
  if (!trip || !trip.workspace_json) notFound();

  const workspace = trip.workspace_json;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-5">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold">{workspace.title}</h1>
          <p className="text-gray-500 mt-1">{workspace.summary}</p>
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

        {/* Days */}
        {workspace.days.map((day, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <h2 className="font-bold text-lg mb-1">Day {day.day} — {day.theme}</h2>
            <p className="text-gray-400 text-sm mb-4">{day.date}</p>
            <div className="space-y-4">
              {day.activities.map((a, j) => (
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
        ))}

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
