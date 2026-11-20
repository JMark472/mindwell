import { cn } from "@/utils/cn";

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("mw-shimmer rounded-xl bg-surface-2", className)} />;
}

export function SkeletonText({ className }: { className?: string }) {
  return <div className={cn("mw-shimmer h-3 rounded-full bg-surface-2", className)} />;
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-white p-5 shadow-card", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <SkeletonText className="w-2/5" />
          <SkeletonText className="h-7 w-1/3" />
          <SkeletonText className="w-1/2" />
        </div>
        <SkeletonBlock className="h-11 w-11 rounded-xl" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3 p-4 sm:p-6" aria-hidden="true">
      <div className="mw-shimmer h-11 rounded-xl bg-surface-2" />
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className="grid gap-3 rounded-xl border border-border p-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }, (_, columnIndex) => (
            <SkeletonText key={columnIndex} className={cn(columnIndex === 0 && "w-2/3")} />
          ))}
        </div>
      ))}
    </div>
  );
}
