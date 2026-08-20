export function SkeletonBlock({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-slate-100 ${className}`} />;
}

export function StatCardSkeleton() {
  return (
    <div className="card p-5">
      <SkeletonBlock className="h-3 w-24" />
      <SkeletonBlock className="mt-3 h-7 w-16" />
    </div>
  );
}
