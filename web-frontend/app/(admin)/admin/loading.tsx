export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-10 animate-pulse">
      <div className="h-10 w-64 rounded-lg bg-sepia/10" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-card bg-sepia/10" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-64 rounded-card bg-sepia/10" />
        <div className="h-64 rounded-card bg-sepia/10" />
      </div>
    </div>
  );
}
