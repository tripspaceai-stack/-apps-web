export default function GuestWorkspace({ params }: { params: { slug: string } }) {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold">Trip: {params.slug}</h1>
      <p className="text-gray-400 mt-2">Guest workspace — coming in Week 3</p>
    </div>
  );
}
