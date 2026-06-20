import { notFound } from 'next/navigation';
import GuestWorkspaceClient from './GuestWorkspaceClient';

interface Trip {
  id: string;
  slug: string;
  share_token: string;
  status: string;
  workspace_json: unknown | null;
  modules_json: unknown | null;
}

async function getTrip(slug: string, token: string): Promise<Trip | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/trips/public/${slug}?token=${token}`,
      { cache: 'no-store' }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function GuestWorkspace({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { slug } = await params;
  const { token } = await searchParams;

  if (!token) notFound();

  const trip = await getTrip(slug, token);
  if (!trip || !trip.workspace_json) notFound();

  return (
    <GuestWorkspaceClient
      tripId={trip.id}
      initialWorkspace={trip.workspace_json as Parameters<typeof GuestWorkspaceClient>[0]['initialWorkspace']}
      modules={trip.modules_json as Parameters<typeof GuestWorkspaceClient>[0]['modules']}
      shareToken={token}
    />
  );
}
