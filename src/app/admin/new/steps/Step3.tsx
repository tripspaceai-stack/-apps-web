'use client';
import { TripForm } from '../page';

interface Props { form: TripForm; update: (f: Partial<TripForm>) => void; onNext: () => void; onBack: () => void; }

export default function Step3({ form, update, onNext, onBack }: Props) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Who's coming?</h2>
      <p className="text-gray-400 text-sm mb-6">Group size and where you'll be staying.</p>
      <div className="space-y-4 mb-8">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Group size</label>
          <div className="flex items-center gap-4">
            <button onClick={() => update({ groupSize: Math.max(1, form.groupSize - 1) })}
              className="w-10 h-10 rounded-full border text-lg font-medium hover:bg-gray-50">−</button>
            <span className="text-2xl font-bold w-8 text-center">{form.groupSize}</span>
            <button onClick={() => update({ groupSize: form.groupSize + 1 })}
              className="w-10 h-10 rounded-full border text-lg font-medium hover:bg-gray-50">+</button>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Accommodation</label>
          <input className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="e.g. Hotel Okura Amsterdam"
            value={form.accommodation} onChange={e => update({ accommodation: e.target.value })} />
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 border py-3 rounded-xl font-medium hover:bg-gray-50">← Back</button>
        <button onClick={onNext}
          className="flex-1 bg-black text-white py-3 rounded-xl font-medium">Continue →</button>
      </div>
    </div>
  );
}
