'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import LoadingButton from '@/components/LoadingButton';

interface Activity {
  name: string;
  description: string;
  address: string;
  startTime: string;
  duration: number;
  travelToNext?: { mode: string; duration: number; note: string };
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

interface Flight {
  direction: string;
  from: string;
  to: string;
  departTime: string;
  arriveTime: string;
  date: string;
  flightNumber: string;
}

interface Modules {
  flights?: Flight[];
  group?: string[];
}

interface Trip {
  id: string;
  title: string;
  status: string;
  slug: string;
  share_token: string;
  workspace_json: Workspace | null;
  modules_json: Modules | null;
}

interface PendingDiff {
  messageId: string;
  summary: string;
  workspace: Workspace;
}

const TRAVEL_ICONS: Record<string, string> = {
  walk: '🚶', drive: '🚗', taxi: '🚕', subway: '🚇',
  bus: '🚌', train: '🚆', boat: '⛵', 'cable car': '🚡',
};

export default function EditTrip() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [activeDay, setActiveDay] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'itinerary' | 'modules' | 'chat'>('itinerary');

  // Modules state
  const [modules, setModules] = useState<Modules>({});
  const [modulesSaving, setModulesSaving] = useState(false);
  const [modulesSaved, setModulesSaved] = useState(false);
  const [ticketParsing, setTicketParsing] = useState(false);
  const [ticketError, setTicketError] = useState('');
  const ticketFileRef = useRef<HTMLInputElement>(null);

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
    const data = await apiRequest(`/trips/${id}`) as Trip & { error?: string };
    if (data.error) { router.push('/admin/dashboard'); return; }
    setTrip(data);
    setModules(data.modules_json || {});
    setLoading(false);
    if (data.status === 'generating') setTimeout(fetchTrip, 3000);
  }

  async function saveModules() {
    setModulesSaving(true);
    await apiRequest(`/trips/${id}/modules`, {
      method: 'PUT',
      body: JSON.stringify({ modules }),
    });
    setModulesSaving(false);
    setModulesSaved(true);
    setTimeout(() => setModulesSaved(false), 2000);
  }

  async function handleTicketUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setTicketParsing(true);
    setTicketError('');
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      try {
        const res = await fetch(`${API}/ai/parse-ticket`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64, mediaType: file.type }),
        });
        const data = await res.json() as { flights?: Flight[]; error?: string };
        if (data.flights?.length) {
          setModules(m => ({ ...m, flights: [...(m.flights || []), ...data.flights!] }));
        } else {
          setTicketError('No flight data found in this file.');
        }
      } catch {
        setTicketError('Failed to parse ticket.');
      }
      setTicketParsing(false);
    };
    reader.readAsDataURL(file);
  }

  function addFlight() {
    setModules(m => ({
      ...m,
      flights: [...(m.flights || []), { direction: 'Outbound', from: '', to: '', departTime: '', arriveTime: '', date: '', flightNumber: '' }],
    }));
  }

  function updateFlight(i: number, field: keyof Flight, value: string) {
    setModules(m => {
      const flights = [...(m.flights || [])];
      flights[i] = { ...flights[i], [field]: value };
      return { ...m, flights };
    });
  }

  function removeFlight(i: number) {
    setModules(m => ({ ...m, flights: (m.flights || []).filter((_, j) => j !== i) }));
  }

  function updateGroup(text: string) {
    const names = text.split('\n').map(s => s.trim()).filter(Boolean);
    setModules(m => ({ ...m, group: names }));
  }

  async function sendChat() {
    if (!chatInput.trim() || chatLoading || pendingDiff) return;
    const msg = chatInput.trim();
    setChatInput('');
    setChatLoading(true);
    const data = await apiRequest(`/trips/${id}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message: msg }),
    }) as { error?: string; messageId: string; summary: string; workspace: Workspace };
    setChatLoading(false);
    if (data.error) { alert(`Error: ${data.error}`); return; }
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
      <div className="text-center"><div className="text-4xl mb-4">✈️</div><p className="text-gray-500 text-lg">Loading your trip...</p></div>
    </div>
  );

  if (trip?.status === 'generating') return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-bounce">🗺️</div>
        <p className="text-xl font-semibold mb-2">Building your itinerary...</p>
        <p className="text-gray-400">This takes about 30 seconds</p>
        <div className="mt-6 w-48 mx-auto bg-gray-200 rounded-full h-2"><div className="bg-black h-2 rounded-full animate-pulse w-2/3" /></div>
      </div>
    </div>
  );

  if (trip?.status === 'failed') return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-xl font-semibold mb-2">Generation failed</p>
        <p className="text-gray-400 text-sm mb-4">Something went wrong with the AI. Try again?</p>
        <LoadingButton
          onClick={async () => {
            await apiRequest(`/trips/${id}/retry`, { method: 'POST' });
            fetchTrip();
          }}
          loadingText="Retrying..."
          className="mt-2 bg-black text-white px-6 py-2 rounded-xl font-medium"
        >
          Retry generation
        </LoadingButton>
        <button onClick={() => router.push('/admin/new')} className="block mt-3 text-sm text-gray-400 hover:text-gray-600 mx-auto">
          Or start a new trip
        </button>
      </div>
    </div>
  );

  const workspace = trip?.workspace_json;
  if (!workspace) return null;

  const shareUrl = `${window.location.origin}/${trip.slug}?token=${trip.share_token}`;
  const displayWorkspace = pendingDiff?.workspace ?? workspace;

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/admin/dashboard')} className="text-gray-400 hover:text-gray-700 text-sm flex items-center gap-1">
            ← Trips
          </button>
          <div>
            <h1 className="text-xl font-bold">{displayWorkspace.title}</h1>
            <p className="text-sm text-gray-400">{displayWorkspace.summary}</p>
          </div>
        </div>
        <LoadingButton onClick={async () => { await navigator.clipboard.writeText(shareUrl); alert('Share link copied!'); }}
          loadingText="Copying..." className="bg-black text-white px-4 py-2 rounded-xl text-sm font-medium">
          Share link 🔗
        </LoadingButton>
      </div>

      {/* Pending diff banner */}
      {pendingDiff && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-amber-600 text-sm font-medium">Proposed changes:</span>
            <span className="text-sm text-gray-700">{pendingDiff.summary}</span>
          </div>
          <div className="flex gap-2">
            <LoadingButton onClick={discardDiff} loadingText="Discarding..." className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-600">Discard</LoadingButton>
            <LoadingButton onClick={confirmDiff} loadingText="Applying..." className="text-sm px-3 py-1.5 rounded-lg bg-black text-white hover:bg-gray-800">Apply changes</LoadingButton>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="bg-white border-b px-6 flex gap-4 shrink-0">
        {(['itinerary', 'modules', 'chat'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`py-3 text-sm font-medium border-b-2 transition capitalize ${activeTab === tab ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            {tab === 'itinerary' ? '📅 Itinerary' : tab === 'modules' ? '⚙️ Modules' : '✏️ Edit with AI'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* ITINERARY TAB */}
        {activeTab === 'itinerary' && (
          <div className="max-w-2xl mx-auto p-6">
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

            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {displayWorkspace.days.map((d, i) => (
                <button key={i} onClick={() => setActiveDay(i)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${activeDay === i ? 'bg-black text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
                  Day {d.day}
                </button>
              ))}
            </div>

            {displayWorkspace.days[activeDay] && (
              <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
                <h2 className="font-bold text-lg mb-1">Day {displayWorkspace.days[activeDay].day} — {displayWorkspace.days[activeDay].theme}</h2>
                <p className="text-gray-400 text-sm mb-4">{displayWorkspace.days[activeDay].date}</p>
                <div className="space-y-0">
                  {displayWorkspace.days[activeDay].activities.map((a, i) => (
                    <div key={i}>
                      <div className="flex gap-4 py-3">
                        <div className="text-sm text-gray-400 w-14 pt-1 shrink-0">{a.startTime}</div>
                        <div className="flex-1 border-l pl-4">
                          <p className="font-semibold">{a.name}</p>
                          <p className="text-gray-500 text-sm mt-0.5">{a.description}</p>
                          <p className="text-gray-400 text-xs mt-1">📍 {a.address} · {a.duration} min</p>
                        </div>
                      </div>
                      {a.travelToNext && (
                        <div className="flex items-center gap-2 pl-14 mb-1">
                          <div className="w-px h-4 bg-gray-200 ml-1" />
                          <span className="text-xs text-gray-400 bg-gray-100 border border-gray-200 rounded-full px-3 py-1">
                            {TRAVEL_ICONS[a.travelToNext.mode] || '🚶'} {a.travelToNext.note} · {a.travelToNext.duration} min
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

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
        )}

        {/* MODULES TAB */}
        {activeTab === 'modules' && (
          <div className="max-w-2xl mx-auto p-6 space-y-6">
            {/* Flights */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-lg">✈️ Flights</h2>
                <button onClick={addFlight} className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg font-medium">+ Add manually</button>
              </div>

              {/* Ticket upload */}
              <input ref={ticketFileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleTicketUpload} />
              <div onClick={() => !ticketParsing && ticketFileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-3 mb-4 flex items-center gap-3 cursor-pointer transition
                  ${ticketParsing ? 'border-gray-200 bg-gray-50 cursor-default' : 'border-gray-200 hover:border-black hover:bg-gray-50'}`}>
                <span className="text-xl">{ticketParsing ? '⏳' : '📎'}</span>
                <div>
                  <p className="text-sm font-medium text-gray-700">{ticketParsing ? 'Reading ticket...' : 'Upload ticket to auto-fill'}</p>
                  <p className="text-xs text-gray-400">{ticketParsing ? 'Claude is extracting flight details' : 'JPG, PNG or PDF'}</p>
                </div>
              </div>
              {ticketError && <p className="text-xs text-red-500 mb-3">{ticketError}</p>}

              {(modules.flights || []).length === 0 && !ticketParsing && (
                <p className="text-sm text-gray-400 text-center py-2">No flights added yet</p>
              )}
              {(modules.flights || []).map((f, i) => (
                <div key={i} className="border rounded-xl p-4 mb-3">
                  <div className="flex justify-between items-center mb-3">
                    <select value={f.direction} onChange={e => updateFlight(i, 'direction', e.target.value)}
                      className="text-sm font-semibold border rounded-lg px-2 py-1">
                      <option>Outbound</option>
                      <option>Return</option>
                    </select>
                    <button onClick={() => removeFlight(i)} className="text-gray-400 hover:text-red-500 text-sm">Remove</button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {([['from', 'From (e.g. TLV)'], ['to', 'To (e.g. CDG)'], ['departTime', 'Depart time'], ['arriveTime', 'Arrive time'], ['date', 'Date'], ['flightNumber', 'Flight #']] as [keyof Flight, string][]).map(([field, label]) => (
                      <div key={field}>
                        <label className="text-xs text-gray-500 font-medium">{label}</label>
                        <input value={f[field]} onChange={e => updateFlight(i, field, e.target.value)}
                          className="w-full border rounded-lg px-2 py-1.5 text-sm mt-1" placeholder={label} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Group */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h2 className="font-bold text-lg mb-4">👥 Group Members</h2>
              <label className="text-xs text-gray-500 font-medium">One name per line</label>
              <textarea
                value={(modules.group || []).join('\n')}
                onChange={e => updateGroup(e.target.value)}
                rows={6}
                placeholder={"Alice\nBob\nCharlie"}
                className="w-full border rounded-xl px-3 py-2 text-sm mt-1 resize-none focus:outline-none focus:ring-2 focus:ring-black"
              />
              <p className="text-xs text-gray-400 mt-2">{(modules.group || []).length} members</p>
            </div>

            <LoadingButton onClick={saveModules} loadingText="Saving..."
              className="w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition">
              {modulesSaved ? '✓ Saved!' : 'Save modules'}
            </LoadingButton>
          </div>
        )}

        {/* CHAT TAB */}
        {activeTab === 'chat' && (
          <div className="max-w-2xl mx-auto p-6 flex flex-col h-full">
            <div className="flex-1 flex flex-col justify-end">
              {!pendingDiff && !chatLoading && (
                <div className="text-center text-gray-400 text-sm py-16">
                  <div className="text-3xl mb-3">✏️</div>
                  <p>Try: "Add a sunset dinner on Day 2" or "Replace the museum with a cooking class"</p>
                </div>
              )}
              {chatLoading && (
                <div className="text-center py-16">
                  <div className="text-3xl mb-3 animate-pulse">🤔</div>
                  <p className="text-sm text-gray-500">Claude is thinking...</p>
                </div>
              )}
              {pendingDiff && (
                <div className="bg-amber-50 rounded-xl p-4 mb-4">
                  <p className="font-medium text-amber-700 mb-1">Proposed changes ready</p>
                  <p className="text-sm text-gray-600">{pendingDiff.summary}</p>
                  <p className="text-xs text-gray-400 mt-2">Switch to Itinerary tab to preview. Apply or discard in the banner above.</p>
                </div>
              )}
            </div>
            <div className="mt-4">
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
              <button onClick={sendChat} disabled={!!pendingDiff || chatLoading || !chatInput.trim()}
                className="mt-2 w-full bg-black text-white text-sm py-2.5 rounded-xl font-medium disabled:opacity-40 hover:bg-gray-800 transition">
                {chatLoading ? 'Thinking...' : 'Send'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
