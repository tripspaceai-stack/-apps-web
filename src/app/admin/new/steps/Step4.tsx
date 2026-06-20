'use client';
import { TripForm } from '../page';
import LoadingButton from '@/components/LoadingButton';

const ACTIVITY_OPTIONS = ['Museums', 'Restaurants', 'Nightlife', 'Nature', 'Shopping', 'Sports', 'Art', 'History'];

interface Props { form: TripForm; update: (f: Partial<TripForm>) => void; onBack: () => void; onSubmit: () => Promise<void>; }

export default function Step4({ form, update, onBack, onSubmit }: Props) {
  function toggleActivity(a: string) {
    const next = form.activities.includes(a)
      ? form.activities.filter(x => x !== a)
      : [...form.activities, a];
    update({ activities: next });
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">What do you enjoy?</h2>
      <p className="text-gray-400 text-sm mb-6">Pick activities and add any preferences.</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {ACTIVITY_OPTIONS.map(a => (
          <button key={a} onClick={() => toggleActivity(a)}
            className={`px-4 py-2 rounded-full border text-sm font-medium transition ${form.activities.includes(a) ? 'bg-black text-white border-black' : 'border-gray-200 hover:border-gray-400'}`}>
            {a}
          </button>
        ))}
      </div>
      <div className="mb-8">
        <label className="text-sm font-medium text-gray-700 block mb-1">Anything else?</label>
        <textarea className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black resize-none"
          rows={3} placeholder="e.g. vegetarian-friendly, budget-conscious, wheelchair accessible..."
          value={form.preferences} onChange={e => update({ preferences: e.target.value })} />
      </div>
      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 border py-3 rounded-xl font-medium hover:bg-gray-50">← Back</button>
        <LoadingButton onClick={onSubmit} loadingText="Generating..."
          className="flex-1 bg-black text-white py-3 rounded-xl font-medium">Generate trip ✨</LoadingButton>
      </div>
    </div>
  );
}
