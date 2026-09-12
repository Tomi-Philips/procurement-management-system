export function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-6 p-6">
      <div className="h-8 w-48 rounded-lg bg-gray-200" />
      <div className="h-4 w-64 rounded bg-gray-200" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-xl bg-gray-200" />
        ))}
      </div>
      <div className="h-96 rounded-xl bg-gray-200" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3 p-6">
      <div className="h-8 w-48 rounded-lg bg-gray-200" />
      <div className="h-10 rounded-lg bg-gray-200" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-14 rounded-lg bg-gray-100" />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-surface p-6">
      <div className="h-4 w-32 rounded bg-gray-200" />
      <div className="mt-3 h-8 w-20 rounded bg-gray-200" />
      <div className="mt-2 h-3 w-24 rounded bg-gray-200" />
    </div>
  );
}
