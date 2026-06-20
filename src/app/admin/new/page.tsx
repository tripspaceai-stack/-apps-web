'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import Step1 from './steps/Step1';
import Step2 from './steps/Step2';
import Step3 from './steps/Step3';
import Step4 from './steps/Step4';

export interface TripForm {
  tripType: string;
  destination: string;
  startDate: string;
  endDate: string;
  groupSize: number;
  accommodation: string;
  activities: string[];
  preferences: string;
}

const INITIAL: TripForm = {
  tripType: '',
  destination: '',
  startDate: '',
  endDate: '',
  groupSize: 2,
  accommodation: '',
  activities: [],
  preferences: '',
};

export default function NewTrip() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<TripForm>(INITIAL);

  useEffect(() => {
    const saved = localStorage.getItem('tripDraft');
    if (saved) setForm(JSON.parse(saved));
  }, []);

  function update(fields: Partial<TripForm>) {
    const next = { ...form, ...fields };
    setForm(next);
    localStorage.setItem('tripDraft', JSON.stringify(next));
  }

  function next() { setStep(s => s + 1); }
  function back() { setStep(s => s - 1); }

  async function submit() {
    const data = await apiRequest('/trips', { method: 'POST', body: JSON.stringify(form) }) as { id?: string; error?: string };
    if (!data.id) { alert(data.error || 'Failed to create trip'); return; }
    localStorage.removeItem('tripDraft');
    router.push(`/admin/${data.id}/edit`);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-lg p-8">
        {/* Progress bar */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className={`h-1.5 flex-1 rounded-full ${n <= step ? 'bg-black' : 'bg-gray-200'}`} />
          ))}
        </div>

        {step === 1 && <Step1 form={form} update={update} onNext={next} />}
        {step === 2 && <Step2 form={form} update={update} onNext={next} onBack={back} />}
        {step === 3 && <Step3 form={form} update={update} onNext={next} onBack={back} />}
        {step === 4 && <Step4 form={form} update={update} onBack={back} onSubmit={submit} />}
      </div>
    </div>
  );
}
