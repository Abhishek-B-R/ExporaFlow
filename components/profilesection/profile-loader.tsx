export default function ProfilePulseLoader() {
  return (
    <div className="ef-card overflow-hidden animate-pulse">
      <div className="px-5 py-4 flex items-center justify-between border-b border-(--border)">
        <div className="space-y-2">
          <div className="h-4 w-28 rounded bg-(--surface-3)" />
          <div className="h-3 w-36 rounded bg-(--surface-3)" />
        </div>
        <div className="size-12 rounded-full bg-(--surface-3)" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="px-5 py-4 border-b border-(--border) space-y-2">
          <div className="h-3 w-16 rounded bg-(--surface-3)" />
          <div className="h-10 w-full rounded-lg bg-(--surface-3)" />
        </div>
      ))}
      <div className="px-5 py-4 flex justify-end">
        <div className="h-9 w-20 rounded-lg bg-(--surface-3)" />
      </div>
    </div>
  );
}
