'use client';
import { useRef, useState } from 'react';
import { TripForm } from '../page';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Props { form: TripForm; update: (f: Partial<TripForm>) => void; onNext: () => void; onBack: () => void; }

export default function Step2({ form, update, onNext, onBack }: Props) {
  const valid = form.destination && form.startDate && form.endDate;
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsing, setParsing] = useState(false);
  const [parseSuccess, setParseSuccess] = useState(false);
  const [parseError, setParseError] = useState('');
  const [dragging, setDragging] = useState(false);

  async function processFile(file: File) {

    setParsing(true);
    setParseSuccess(false);
    setParseError('');

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      const mediaType = file.type;

      try {
        const res = await fetch(`${API}/ai/parse-ticket`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64, mediaType }),
        });
        if (!res.ok) {
          const text = await res.text();
          setParseError(`Server error ${res.status}: ${text.slice(0, 100)}`);
          setParsing(false);
          return;
        }
        const data = await res.json();

        const updates: Partial<TripForm> = {};
        if (data.destination) updates.destination = data.destination;
        if (data.startDate) updates.startDate = data.startDate;
        if (data.endDate) updates.endDate = data.endDate;
        if (data.flights?.length) updates.flights = data.flights;

        if (Object.keys(updates).length > 0) {
          update(updates);
          setParseSuccess(true);
        } else {
          setParseError('Could not extract trip details from this image. Please fill in manually.');
        }
      } catch (err) {
        setParseError(`Error: ${err}. Please fill in manually.`);
      }
      setParsing(false);
    };
    reader.readAsDataURL(file);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Where and when?</h2>
      <p className="text-gray-400 text-sm mb-6">Tell us your destination and travel dates.</p>

      {/* Upload ticket */}
      <div
        onClick={() => !parsing && fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-4 mb-5 flex items-center gap-3 cursor-pointer transition
          ${parsing ? 'border-gray-300 bg-gray-50 cursor-default' :
            dragging ? 'border-black bg-gray-50 scale-[1.01]' :
            'border-gray-300 hover:border-black hover:bg-gray-50'}`}
      >
        <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFile} />
        <div className="text-2xl">{parsing ? '⏳' : '📎'}</div>
        <div>
          <p className="text-sm font-medium text-gray-700">
            {parsing ? 'Reading your ticket...' : 'Upload flight ticket or booking'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {parsing ? 'Claude is extracting your trip details' : 'JPG, PNG, or PDF — auto-fills destination & dates'}
          </p>
        </div>
        {!parsing && <span className="ml-auto text-xs bg-gray-100 px-3 py-1.5 rounded-lg font-medium text-gray-600">Browse</span>}
      </div>

      {parseSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-2.5 mb-4 flex items-center gap-2">
          ✓ Trip details extracted — review and edit below
        </div>
      )}
      {parseError && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-2.5 mb-4">
          {parseError}
        </div>
      )}

      <div className="space-y-4 mb-8">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Destination</label>
          <input className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="e.g. Amsterdam, Netherlands"
            value={form.destination} onChange={e => update({ destination: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Start date</label>
            <input type="date" className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
              value={form.startDate} onChange={e => update({ startDate: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">End date</label>
            <input type="date" className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
              value={form.endDate} onChange={e => update({ endDate: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 border py-3 rounded-xl font-medium hover:bg-gray-50">← Back</button>
        <button onClick={onNext} disabled={!valid}
          className="flex-1 bg-black text-white py-3 rounded-xl font-medium disabled:opacity-40">Continue →</button>
      </div>
    </div>
  );
}
