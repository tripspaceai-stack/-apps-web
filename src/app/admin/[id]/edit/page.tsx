'use client';
import { useEffect, useState, useRef } from 'react';
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

interface PendingDiff {
  messageId: string;
  summary: string;
  workspace: Workspace;
}

export default function EditTrip() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [activeDay, setActiveDay] = useState(0);
  const [loading, setLoading] = useState(true);

  // Chat state
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [pendingDiff, setPendingDiff] = useState<PendingDiff | null>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) { router.push('/auth'); return; }
    fetchTrip();
  }, [id]);

  async function fetchTrip() {
    const data = await apiRequest(`/trips/${id}`);
    if (data.error) { router.push('/admin/dashboard'); return; }
    setTrip(data);
    setLoading(false);

    if (data.status === 'generating') {
      setTimeout(fetchTrip, 3000);
    }
  }

  async function sendChat() {
    if (!chatInput.trim() || chatLoading || pendingDiff) return;
    const msg = chatInput.trim();
    setChatInput('');
    setChatLoading(true);

    const data = await apiRequest(`/trips/${id}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message: msg }),
    });

    setChatLoading(false);

    if (data.error) {
      alert(`Error: ${data.error}`);
      return;
    }

    setPendingDiff({ messageId: data.messageId, summary: data.summary, workspace: data.workspace });
  }

  async function confirmDiff() {
    if (!pendingDiff) return;
    await apiRequest(`/trips/${id}/chat/confirm`, {
      method: 'POST',
      body: JSON.stringify({ messageId: pendingDiff.messageId, workspace: pendingDiff.workspace }),
    });
    setTrip(prev => prev ? { ...prev, workspace_json: pendingDiff.workspace } : prev);
    setPendingDiff(null);
  }

  async function discardDiff() {
    if (!pendingDiff) return;
    await apiRequest(`/trips/${id}/chat/discard`, {
      method: 'POST',
      body: JSON.stringify({ messageId: pendingDiff.messageId }),
    });
    setPendingDiff(null);
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
  const displayWorkspace = pendingDiff?.workspace ?? workspace;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold">{displayWorkspace.title}</h1>
          <p className="text-sm text-gray-400">{displayWorkspace.summary}</p>
        </div>
        <button onClick={() => { navigator.clipboard.writeText(shareUrl); alert('Share link copied!'); }}
          className="bg-black text-white px-4 py-2 rounded-xl text-sm font-medium">
          Share link 🔗
        </button>
      </div>

      {/* Pending diff banner */}
      {pendingDiff && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-amber-600 text-sm font-medium">Proposed changes:</span>
            <span className="text-sm text-gray-700">{pendingDiff.summary}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={discardDiff}
              className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-600">
              Discard
            </button>
            <button onClick={confirmDiff}
              className="text-sm px-3 py-1.5 rounded-lg bg-black text-white hover:bg-gray-800">
              Apply changes
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto">
            {/* Hotel */}
            {displayWorkspace.hotels.length > 0 && (
              <div className="bg-white rounded-2xl p-5 mb-6 shadow-sm">
                <h2 className="font-semibold text-gray-500 text-xs uppercase tracking-wide mb-3">Accommodation</h2>
                {displayWorkspace.hotels.map((h, i) => (
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
              {displayWorkspace.days.map((d, i) => (
                <button key={i} onClick={() => setActiveDay(i)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${activeDay === i ? 'bg-black text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
                  Day {d.day}
                </button>
              ))}
            </div>

            {/* Active day */}
            {displayWorkspace.days[activeDay] && (
              <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
                <h2 className="font-bold text-lg mb-1">Day {displayWorkspace.days[activeDay].day} — {displayWorkspace.days[activeDay].theme}</h2>
                <p className="text-gray-400 text-sm mb-4">{displayWorkspace.days[activeDay].date}</p>
                <div className="space-y-4">
                  {displayWorkspace.days[activeDay].activities.map((a, i) => (
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
            {displayWorkspace.tips.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h2 className="font-semibold text-gray-500 text-xs uppercase tracking-wide mb-3">Travel Tips</h2>
                <ul className="space-y-2">
                  {displayWorkspace.tips.map((t, i) => (
                    <li key={i} className="text-sm text-gray-600 flex gap-2">
                      <span className="text-yellow-500 shrink-0">💡</span>{t}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Chat sidebar */}
        <div className="w-80 bg-white border-l flex flex-col shrink-0">
          <div className="px-4 py-3 border-b">
            <h2 className="font-semibold text-sm">Edit with AI</h2>
            <p className="text-xs text-gray-400 mt-0.5">Describe changes and Claude will update your itinerary</p>
          </div>

          <div className="flex-1 flex flex-col justify-end p-4">
            {!pendingDiff && !chatLoading && (
              <div className="text-center text-gray-400 text-sm py-8">
                <div className="text-2xl mb-2">✏️</div>
                <p>Try: "Add a sunset dinner on Day 2" or "Replace the museum with a cooking class"</p>
              </div>
            )}

            {chatLoading && (
              <div className="text-center py-8">
                <div className="text-2xl mb-2 animate-pulse">🤔</div>
                <p className="text-sm text-gray-500">Claude is thinking...</p>
              </div>
            )}

            {pendingDiff && (
              <div className="bg-amber-50 rounded-xl p-3 mb-4 text-sm">
                <p className="font-medium text-amber-700 mb-1">Proposed changes ready</p>
                <p className="text-gray-600">{pendingDiff.summary}</p>
                <p className="text-xs text-gray-400 mt-2">Preview is shown in the itinerary. Apply or discard above.</p>
              </div>
            )}
          </div>

          <div className="p-4 border-t">
            <textarea
              ref={chatInputRef}
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
              placeholder={pendingDiff ? 'Apply or discard first...' : 'Describe a change...'}
              disabled={!!pendingDiff || chatLoading}
              rows={3}
              className="w-full resize-none text-sm border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black disabled:bg-gray-50 disabled:text-gray-400"
            />
            <button
              onClick={sendChat}
              disabled={!!pendingDiff || chatLoading || !chatInput.trim()}
              className="mt-2 w-full bg-black text-white text-sm py-2 rounded-xl font-medium disabled:opacity-40 hover:bg-gray-800 transition">
              {chatLoading ? 'Thinking...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
