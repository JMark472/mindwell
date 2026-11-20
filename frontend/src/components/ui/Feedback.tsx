import { cn } from "@/utils/cn";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";

export function Alert({
  className,
  tone = "danger",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  tone?: "danger" | "warning" | "info" | "success";
}) {
  const tones = {
    danger: "border-danger/25 bg-danger-soft/90 text-ink",
    warning: "border-warning/25 bg-warning-soft/90 text-ink",
    info: "border-info/25 bg-info-soft/90 text-ink",
    success: "border-success/25 bg-success-soft/90 text-ink",
  } as const;

  const iconTones = {
    danger: "text-danger",
    warning: "text-warning",
    info: "text-info",
    success: "text-success",
  } as const;

  const icons = {
    danger: CircleAlert,
    warning: TriangleAlert,
    info: Info,
    success: CircleCheck,
  } as const;

  const Icon = icons[tone];

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2.5 rounded-field border px-3.5 py-3 text-sm leading-relaxed",
        tones[tone],
        className,
      )}
      {...props}
    >
      <Icon aria-hidden="true" strokeWidth={1.8} className={cn("mt-0.5 h-4 w-4 shrink-0", iconTones[tone])} />
      <span className="min-w-0 flex-1">{children}</span>
    </div>
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
        "mw-card mw-empty-state flex flex-col items-center justify-center px-6 py-10 text-center",
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
  return <div className={cn("mw-shimmer h-3 rounded-pill bg-surface-2", className)} />;
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("mw-card p-6", className)}>
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
