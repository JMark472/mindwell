import { cn } from "@/utils/cn";

export function Alert({
  className,
  tone = "danger",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  tone?: "danger" | "warning" | "info" | "success";
}) {
  const tones = {
    danger: "border-danger/30 bg-danger-soft text-danger",
    warning: "border-warning/30 bg-warning-soft text-warning",
    info: "border-info/30 bg-info-soft text-info",
    success: "border-success/30 bg-success-soft text-success",
  } as const;

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-field border px-3 py-2 text-sm",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mw-card flex flex-col items-center justify-center px-6 py-10 text-center",
        className,
      )}
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-mint-soft">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-5 w-5 text-teal"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-ink-400">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function SkeletonLine({ className }: { className?: string }) {
  return <div className={cn("h-3 animate-pulse rounded-pill bg-surface-2", className)} />;
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("mw-card animate-pulse p-6", className)}>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-surface-2" />
        <div className="flex-1 space-y-2">
          <SkeletonLine className="w-1/3" />
          <SkeletonLine className="w-1/4" />
        </div>
      </div>
      <div className="mt-5 space-y-2">
        <SkeletonLine />
        <SkeletonLine />
        <SkeletonLine className="w-2/3" />
      </div>
    </div>
  );
}
