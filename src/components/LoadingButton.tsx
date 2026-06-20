'use client';
import { useState } from 'react';

interface Props {
  onClick: () => Promise<void> | void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  loadingText?: string;
}

export default function LoadingButton({ onClick, disabled, className, children, loadingText }: Props) {
  const [loading, setLoading] = useState(false);

  async function handle() {
    if (loading || disabled) return;
    setLoading(true);
    try {
      await onClick();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={handle} disabled={loading || disabled}
      className={`relative transition ${className ?? ''} disabled:opacity-50`}>
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
          </svg>
          {loadingText ?? 'Loading...'}
        </span>
      ) : children}
    </button>
  );
}
