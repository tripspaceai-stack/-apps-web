'use client';
import { TripForm } from '../page';

const TYPES = [
  { id: 'friends', label: '👫 Friends', desc: 'A trip with your crew' },
  { id: 'family', label: '👨‍👩‍👧 Family', desc: 'Family getaway' },
  { id: 'work', label: '💼 Work', desc: 'Team offsite or conference' },
  { id: 'sport', label: '🏄 Sport', desc: 'Active adventure' },
];

interface Props { form: TripForm; update: (f: Partial<TripForm>) => void; onNext: () => void; }

export default function Step1({ form, update, onNext }: Props) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-1">What kind of trip is this?</h2>
      <p className="text-gray-400 text-sm mb-6">Choose the type that best fits your group.</p>
      <div className="grid grid-cols-2 gap-3 mb-8">
        {TYPES.map(t => (
          <button key={t.id} onClick={() => update({ tripType: t.id })}
            className={`border-2 rounded-xl p-4 text-left transition ${form.tripType === t.id ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}>
            <div className="text-lg font-medium">{t.label}</div>
            <div className="text-xs text-gray-400 mt-1">{t.desc}</div>
          </button>
        ))}
      </div>
      <button onClick={onNext} disabled={!form.tripType}
        className="w-full bg-black text-white py-3 rounded-xl font-medium disabled:opacity-40">
        Continue →
      </button>
    </div>
  );
}
