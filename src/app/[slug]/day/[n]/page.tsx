export default function DayDetail({ params }: { params: { slug: string; n: string } }) {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold">{params.slug} — Day {params.n}</h1>
      <p className="text-gray-400 mt-2">Day detail — coming in Week 3</p>
    </div>
  );
}
