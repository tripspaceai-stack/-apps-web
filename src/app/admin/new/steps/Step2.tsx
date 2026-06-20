'use client';
import { TripForm } from '../page';

interface Props { form: TripForm; update: (f: Partial<TripForm>) => void; onNext: () => void; onBack: () => void; }

export default function Step2({ form, update, onNext, onBack }: Props) {
  const valid = form.destination && form.startDate && form.endDate;
  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Where and when?</h2>
      <p className="text-gray-400 text-sm mb-6">Tell us your destination and travel dates.</p>
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
