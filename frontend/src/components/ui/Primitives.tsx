import React from "react";
import { cn } from "@/utils/cn";
import { Eye, EyeOff, Loader2, type LucideIcon } from "lucide-react";

export function Button({
  className,
  variant = "primary",
  size = "md",
  asChild,
  loading = false,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "glass";
  size?: "sm" | "md" | "lg";
  asChild?: boolean;
  loading?: boolean;
}) {
  const styles = {
    primary:
      "border border-transparent bg-primary-dark text-white shadow-[0_8px_22px_-14px_rgba(13,148,136,0.9)] hover:bg-primary-deep hover:shadow-lift focus-visible:ring-2 focus-visible:ring-primary/30",
    secondary:
      "border border-border bg-white text-heading shadow-card hover:border-primary/30 hover:bg-light-mint hover:shadow-lift",
    glass:
      "border border-border bg-white text-heading shadow-card hover:border-primary/30 hover:bg-light-mint",
    ghost: "border border-transparent text-body hover:bg-light-mint hover:text-heading",
    danger:
      "border border-transparent bg-danger text-white shadow-[0_8px_22px_-14px_rgba(220,38,38,0.9)] hover:bg-danger-ink",
  } as const;

  const sizes = {
    sm: "min-h-9 px-3 py-2 text-xs sm:h-9 sm:py-0",
    md: "min-h-11 px-4 py-2.5 text-sm sm:h-11 sm:py-0",
    lg: "min-h-12 px-5 py-3 text-sm sm:h-12 sm:py-0",
  } as const;

  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-field font-medium transition-all duration-200 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]",
    styles[variant],
    sizes[size],
    className,
  );

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<any>;
    return React.cloneElement(child, {
      className: cn(classes, child.props.className),
    });
  }

  return (
    <button className={classes} {...props} disabled={loading || props.disabled}>
      {loading ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "min-h-11 w-full rounded-field border border-border bg-white px-3.5 py-2.5 text-sm text-heading placeholder:text-body transition-all focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10",
        className,
      )}
      {...props}
    />
  );
}

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn("text-xs font-medium text-ink-600", className)} {...props} />
  );
}

/** Text input with a leading icon, used by the auth forms. */
export function IconInput({
  icon: Icon,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon: LucideIcon }) {
  return (
    <div className="relative">
      <Icon
        aria-hidden="true"
        strokeWidth={1.8}
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-body"
      />
      <Input className={cn("pl-9", className)} {...props} />
    </div>
  );
}

/** Password input with a keyboard-accessible show/hide toggle. */
export function PasswordInput({
  icon: Icon,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon?: LucideIcon }) {
  const [visible, setVisible] = React.useState(false);

  return (
    <div className="relative">
      {Icon ? (
        <Icon
          aria-hidden="true"
          strokeWidth={1.8}
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-body"
        />
      ) : null}
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={cn(
          "min-h-11 w-full rounded-field border border-border bg-white pr-11 text-sm text-heading placeholder:text-body transition-all focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10",
          Icon ? "pl-9" : "pl-3.5",
          className,
        )}
      />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-field text-body transition-colors hover:bg-light-mint hover:text-heading"
      >
        {visible ? (
          <EyeOff aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
        ) : (
          <Eye aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

/** Rounded, tinted tile that frames a single icon. */
export function IconBadge({
  icon: Icon,
  tone = "teal",
  className,
}: {
  icon: LucideIcon;
  tone?: "teal" | "mint" | "navy" | "danger" | "sky" | "violet";
  className?: string;
}) {
  const tones = {
    teal: "bg-light-mint text-primary-dark ring-1 ring-primary/15",
    mint: "bg-light-mint text-primary-deep ring-1 ring-primary/15",
    navy: "bg-light-mint text-primary-dark ring-1 ring-primary/15",
    danger: "bg-danger-soft text-danger-ink ring-1 ring-danger/15",
    sky: "bg-info-soft text-info-ink ring-1 ring-info/15",
    violet: "bg-[#f5f3ff] text-[#5b21b6] ring-1 ring-[#5b21b6]/15",
  } as const;

  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-card",
        tones[tone],
        className,
      )}
    >
      <Icon strokeWidth={1.8} className="h-5 w-5" />
    </span>
  );
}

export function Card({
  className,
  hover = true,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return <div className={cn("mw-card", hover && "mw-card-hover", className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-field border border-border bg-white px-3.5 py-2.5 text-sm text-heading placeholder:text-body transition-all focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10",
        className,
      )}
      {...props}
    />
  );
}

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "success" | "warning" | "danger" | "info" | "teal" | "primary";
}) {
  const tones = {
    neutral: "bg-surface-2 text-ink-500 ring-1 ring-border",
    success: "bg-success-soft text-success-ink ring-1 ring-success/20",
    warning: "bg-warning-soft text-warning-ink ring-1 ring-warning/25",
    danger: "bg-danger-soft text-danger-ink ring-1 ring-danger/20",
    info: "bg-info-soft text-info-ink ring-1 ring-info/20",
    teal: "bg-light-mint text-primary-dark ring-1 ring-primary/20",
    primary: "bg-primary-dark text-white shadow-sm",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill px-2.5 py-0.5 text-[11px] font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5 p-6 pb-4", className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-lg font-semibold tracking-tight", className)} {...props} />;
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-ink-400", className)} {...props} />;
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center gap-2 p-6 pt-0", className)} {...props} />;
}
 

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "min-h-11 w-full appearance-none rounded-field border border-border bg-white px-3.5 py-2.5 text-sm text-heading transition-all focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function StatCard({
  icon: Icon,
  label,
  value,
  change,
  tone = "teal",
  className,
}: {
 icon: LucideIcon;
 label: string;
 value: string | number;
 change?: string;
   tone?: "teal" | "mint" | "navy" | "danger" | "sky" | "violet" | "success";
 className?: string;
}) {
  const tones = {
    teal: "bg-light-mint",
    mint: "bg-light-mint",
    navy: "bg-light-mint",
    danger: "bg-danger-soft",
    sky: "bg-info-soft",
    violet: "bg-[#f5f3ff]",
    success: "bg-success-soft",
  } as const;

  return (
    <Card className={cn("relative overflow-hidden p-6", className)}>
      <div className={cn("absolute -right-12 -top-12 h-28 w-28 rounded-full opacity-60", tones[tone])} />
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-body">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
          {change ? <p className="mt-1 text-sm text-ink-400">{change}</p> : null}
        </div>
        <IconBadge icon={Icon} tone={tone === "violet" ? "violet" : tone === "sky" ? "sky" : tone === "danger" ? "danger" : tone === "navy" ? "navy" : tone === "mint" ? "mint" : "teal"} />
      </div>
    </Card>
  );
}

