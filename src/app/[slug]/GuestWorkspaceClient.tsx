'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Activity {
  name: string;
  description: string;
  address: string;
  startTime: string;
  duration: number;
  travelToNext?: { mode: string; duration: number; note: string };
}
interface Day { day: number; date: string; theme: string; activities: Activity[]; }
interface Hotel { name: string; address: string; checkIn: string; checkOut: string; notes: string; }
interface Workspace { title: string; summary: string; days: Day[]; hotels: Hotel[]; tips: string[]; }
interface Flight { direction: string; from: string; to: string; departTime: string; arriveTime: string; date: string; flightNumber: string; }
interface Modules { flights?: Flight[]; group?: string[]; }
interface Expense { id: string; amount: number; currency: string; description: string; reporter_name: string; date: string; paid: boolean; }
interface Suggestion { id: string; content: string; author_name: string; votes: string[]; created_at: string; }

const TRAVEL_ICONS: Record<string, string> = {
  walk: '🚶', drive: '🚗', taxi: '🚕', subway: '🚇',
  bus: '🚌', train: '🚆', boat: '⛵', 'cable car': '🚡',
};

interface Props {
  tripId: string;
  initialWorkspace: Workspace;
  modules: Modules | null;
  shareToken: string;
}

type Tab = 'itinerary' | 'flights' | 'group' | 'expenses' | 'suggestions';

export default function GuestWorkspaceClient({ tripId, initialWorkspace, modules, shareToken }: Props) {
  const [workspace, setWorkspace] = useState<Workspace>(initialWorkspace);
  const [updated, setUpdated] = useState(false);
  const [activeDay, setActiveDay] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>('itinerary');

  // Expenses
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expAmount, setExpAmount] = useState('');
  const [expCurrency, setExpCurrency] = useState('$');
  const [expDesc, setExpDesc] = useState('');
  const [expName, setExpName] = useState('');
  const [expDate, setExpDate] = useState('');
  const [expSaving, setExpSaving] = useState(false);

  // Suggestions
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [sugText, setSugText] = useState('');
  const [sugName, setSugName] = useState('');
  const [sugSaving, setSugSaving] = useState(false);
  const [voterName, setVoterName] = useState('');

  const apiBase = `${API}/trips/${tripId}/modules`;
  const q = `?token=${shareToken}`;

  useEffect(() => {
    const channel = supabase
      .channel(`trip-${tripId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'trips', filter: `id=eq.${tripId}` }, (payload) => {
        const w = (payload.new as { workspace_json: Workspace }).workspace_json;
        if (w) { setWorkspace(w); setUpdated(true); setTimeout(() => setUpdated(false), 3000); }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tripId]);

  useEffect(() => {
    if (activeTab === 'expenses') fetchExpenses();
    if (activeTab === 'suggestions') fetchSuggestions();
  }, [activeTab]);

  async function fetchExpenses() {
    const res = await fetch(`${apiBase}/expenses${q}`);
    if (res.ok) setExpenses(await res.json());
  }

  async function fetchSuggestions() {
    const res = await fetch(`${apiBase}/suggestions${q}`);
    if (res.ok) setSuggestions(await res.json());
  }

  async function submitExpense() {
    if (!expAmount || !expDesc || !expName) return;
    setExpSaving(true);
    const res = await fetch(`${apiBase}/expenses${q}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: parseFloat(expAmount), currency: expCurrency, description: expDesc, reporter_name: expName, date: expDate || new Date().toISOString().split('T')[0] }),
    });
    if (res.ok) {
      setExpAmount(''); setExpDesc(''); setExpDate('');
      await fetchExpenses();
    }
    setExpSaving(false);
  }

  async function submitSuggestion() {
    if (!sugText || !sugName) return;
    setSugSaving(true);
    const res = await fetch(`${apiBase}/suggestions${q}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: sugText, author_name: sugName }),
    });
    if (res.ok) { setSugText(''); await fetchSuggestions(); }
    setSugSaving(false);
  }

  async function toggleVote(sugId: string) {
    const name = voterName || sugName;
    if (!name) { alert('Enter your name first'); return; }
    await fetch(`${apiBase}/suggestions/${sugId}/vote${q}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voter_name: name }),
    });
    await fetchSuggestions();
  }

  const tabs: { key: Tab; label: string; show: boolean }[] = [
    { key: 'itinerary', label: '📅 Itinerary', show: true },
    { key: 'flights', label: '✈️ Flights', show: !!(modules?.flights?.length) },
    { key: 'group', label: '👥 Group', show: !!(modules?.group?.length) },
    { key: 'expenses', label: '💸 Expenses', show: true },
    { key: 'suggestions', label: '💡 Suggestions', show: true },
  ].filter(t => t.show);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-5">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{workspace.title}</h1>
            <p className="text-gray-500 mt-1">{workspace.summary}</p>
          </div>
          {updated && <span className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-medium animate-pulse">✓ Updated live</span>}
        </div>
      </div>

      {/* Tab nav */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`py-3 px-4 text-sm font-medium border-b-2 whitespace-nowrap transition ${activeTab === t.key ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6">

        {/* ITINERARY */}
        {activeTab === 'itinerary' && (
          <>
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

            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {workspace.days.map((d, i) => (
                <button key={i} onClick={() => setActiveDay(i)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${activeDay === i ? 'bg-black text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
                  Day {d.day}
                </button>
              ))}
            </div>

            {workspace.days[activeDay] && (
              <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
                <h2 className="font-bold text-lg mb-1">Day {workspace.days[activeDay].day} — {workspace.days[activeDay].theme}</h2>
                <p className="text-gray-400 text-sm mb-4">{workspace.days[activeDay].date}</p>
                <div>
                  {workspace.days[activeDay].activities.map((a, j) => (
                    <div key={j}>
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

            {workspace.tips.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
                <h2 className="font-semibold text-gray-400 text-xs uppercase tracking-wide mb-3">Travel Tips</h2>
                <ul className="space-y-2">
                  {workspace.tips.map((t, i) => (
                    <li key={i} className="text-sm text-gray-600 flex gap-2"><span className="text-yellow-500 shrink-0">💡</span>{t}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {/* FLIGHTS */}
        {activeTab === 'flights' && (
          <div className="space-y-4">
            {(modules?.flights || []).map((f, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-4">{f.direction}</p>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-black text-gray-900">{f.from}</p>
                    <p className="text-lg font-bold">{f.departTime}</p>
                    <p className="text-xs text-gray-400">{f.date}</p>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-lg">✈</div>
                    <div className="h-px bg-gray-200 my-1" />
                    <p className="text-xs text-gray-400">{f.flightNumber}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-gray-900">{f.to}</p>
                    <p className="text-lg font-bold">{f.arriveTime}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* GROUP */}
        {activeTab === 'group' && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-lg mb-4">👥 {modules?.group?.length} Travelers</h2>
            <div className="grid grid-cols-2 gap-3">
              {(modules?.group || []).map((name, i) => (
                <div key={i} className="flex items-center gap-3 p-3 border rounded-xl">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-800 to-gray-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium">{name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EXPENSES */}
        {activeTab === 'expenses' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h2 className="font-bold text-lg mb-4">💸 Add Expense</h2>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium">Your name</label>
                  <input value={expName} onChange={e => setExpName(e.target.value)} placeholder="Your name"
                    className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium">Date</label>
                  <input type="date" value={expDate} onChange={e => setExpDate(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium">Amount</label>
                  <input type="number" value={expAmount} onChange={e => setExpAmount(e.target.value)} placeholder="0.00"
                    className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium">Currency</label>
                  <select value={expCurrency} onChange={e => setExpCurrency(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm mt-1">
                    <option>$</option><option>€</option><option>£</option><option>₪</option>
                  </select>
                </div>
              </div>
              <div className="mb-3">
                <label className="text-xs text-gray-500 font-medium">Description</label>
                <input value={expDesc} onChange={e => setExpDesc(e.target.value)} placeholder="e.g. Dinner at restaurant"
                  className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
              </div>
              <button onClick={submitExpense} disabled={expSaving || !expAmount || !expDesc || !expName}
                className="w-full bg-black text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-40">
                {expSaving ? 'Saving...' : 'Add expense'}
              </button>
            </div>

            {expenses.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {expenses.map(e => (
                  <div key={e.id} className="flex items-center gap-3 px-5 py-4 border-b last:border-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-800 to-gray-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {e.reporter_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{e.description}</p>
                      <p className="text-xs text-gray-400">{e.reporter_name} · {e.date}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold">{e.currency}{e.amount}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${e.paid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {e.paid ? 'Paid' : 'Unpaid'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SUGGESTIONS */}
        {activeTab === 'suggestions' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h2 className="font-bold text-lg mb-4">💡 Add Suggestion</h2>
              <div className="mb-3">
                <label className="text-xs text-gray-500 font-medium">Your name</label>
                <input value={sugName} onChange={e => { setSugName(e.target.value); setVoterName(e.target.value); }} placeholder="Your name"
                  className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
              </div>
              <div className="mb-3">
                <label className="text-xs text-gray-500 font-medium">Suggestion</label>
                <textarea value={sugText} onChange={e => setSugText(e.target.value)} placeholder="Share an idea for the trip..."
                  rows={3} className="w-full border rounded-lg px-3 py-2 text-sm mt-1 resize-none" />
              </div>
              <button onClick={submitSuggestion} disabled={sugSaving || !sugText || !sugName}
                className="w-full bg-black text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-40">
                {sugSaving ? 'Posting...' : 'Post suggestion'}
              </button>
            </div>

            {suggestions.map(s => (
              <div key={s.id} className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-800 to-gray-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {s.author_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{s.author_name}</p>
                    <p className="text-xs text-gray-400">{new Date(s.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-3">{s.content}</p>
                <button onClick={() => toggleVote(s.id)}
                  className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-full border transition ${(s.votes || []).includes(voterName || sugName) ? 'bg-blue-50 border-blue-300 text-blue-600' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}>
                  👍 {(s.votes || []).length}
                </button>
              </div>
            ))}

            {suggestions.length === 0 && (
              <div className="text-center text-gray-400 py-12">
                <div className="text-3xl mb-2">💬</div>
                <p className="text-sm">No suggestions yet — be the first!</p>
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="text-center py-8 border-t mt-6">
          <p className="text-gray-400 text-sm mb-3">Want to plan your own trip?</p>
          <a href="/auth" className="inline-block bg-black text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800">
            Create your own trip ✈️
          </a>
        </div>
      </div>
    </div>
  );
}
