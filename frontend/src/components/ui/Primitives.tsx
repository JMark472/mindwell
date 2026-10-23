import React from "react";
import { cn } from "@/utils/cn";
import { Eye, EyeOff, type LucideIcon } from "lucide-react";

export function Button({
  className,
  variant = "primary",
  size = "md",
  asChild,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  asChild?: boolean;
}) {
  const styles = {
    primary:
      "bg-teal text-white shadow-[0_1px_1px_rgba(11,53,95,0.04)] hover:bg-teal-600 focus-visible:ring-2 focus-visible:ring-teal/40",
    secondary:
      "border border-line bg-surface text-ink hover:bg-navy-050",
    ghost: "text-ink-600 hover:bg-navy-050 hover:text-ink",
    danger: "bg-danger text-white hover:bg-[#991b0f]",
  } as const;

  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-11 px-5 text-sm",
  } as const;

  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-field font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
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
    <button className={classes} {...props}>
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
        "h-10 w-full rounded-field border border-line bg-surface px-3 text-sm text-ink placeholder:text-ink-300 focus-visible:border-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/15",
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
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300"
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
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300"
        />
      ) : null}
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={cn(
          "h-10 w-full rounded-field border border-line bg-surface pr-10 text-sm text-ink placeholder:text-ink-300 focus-visible:border-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/15",
          Icon ? "pl-9" : "pl-3",
          className,
        )}
      />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-field text-ink-300 transition-colors hover:bg-navy-050 hover:text-ink-600"
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
  tone?: "teal" | "mint" | "navy" | "danger" | "sky";
  className?: string;
}) {
  const tones = {
    teal: "bg-mint-soft text-teal-600",
    mint: "bg-[#eafaf3] text-[#17805f]",
    navy: "bg-navy-050 text-navy",
    danger: "bg-danger-soft text-danger",
    sky: "bg-info-soft text-info",
  } as const;

  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-field",
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
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mw-card", className)} {...props} />;
}

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}) {
  const tones = {
    neutral: "bg-navy-050 text-ink-600",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    danger: "bg-danger-soft text-danger",
    info: "bg-info-soft text-info",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill px-2 py-0.5 text-[11px] font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
