'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) router.push('/auth');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">My Trips</h1>
          <Link href="/admin/new"
            className="bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800">
            + New Trip
          </Link>
        </div>
        <div className="text-gray-400 text-center py-20">No trips yet. Create your first one!</div>
      </div>
    </div>
  );
}
