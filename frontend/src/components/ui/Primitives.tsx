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
  variant?: "primary" | "secondary" | "ghost" | "danger" | "glass";
  size?: "sm" | "md" | "lg";
  asChild?: boolean;
}) {
  const styles = {
    primary:
      "bg-gradient-to-r from-teal to-teal-600 text-white shadow-[0_10px_40px_-18px_rgba(16,169,155,1)] hover:from-teal-600 hover:to-teal-700 focus-visible:ring-2 focus-visible:ring-teal/40",
    secondary:
      "border border-line/80 bg-surface/90 text-ink shadow-card backdrop-blur hover:bg-white hover:shadow-lift",
    glass:
      "border border-white/60 bg-white/80 text-ink shadow-card backdrop-blur-xl hover:bg-white",
    ghost: "text-ink-600 hover:bg-navy-050 hover:text-ink",
    danger: "bg-gradient-to-r from-danger to-[#991b0f] text-white shadow-[0_10px_40px_-18px_rgba(180,35,24,1)] hover:brightness-105",
  } as const;

  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-11 px-5 text-sm",
  } as const;

  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-field font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.99]",
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
        "h-11 w-full rounded-field border border-line/80 bg-surface/90 px-3 text-sm text-ink placeholder:text-ink-300 shadow-[inset_0_1px_0_rgb(255_255_255/0.7)] transition-all focus-visible:border-teal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/10",
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
          "h-11 w-full rounded-field border border-line/80 bg-surface/90 pr-10 text-sm text-ink placeholder:text-ink-300 shadow-[inset_0_1px_0_rgb(255_255_255/0.7)] transition-all focus-visible:border-teal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/10",
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
  tone?: "teal" | "mint" | "navy" | "danger" | "sky" | "violet";
  className?: string;
}) {
  const tones = {
    teal: "bg-gradient-to-br from-mint-soft to-white text-teal-600 ring-1 ring-teal/10",
    mint: "bg-gradient-to-br from-[#eafaf3] to-white text-[#17805f] ring-1 ring-[#17805f]/10",
    navy: "bg-gradient-to-br from-navy-050 to-white text-navy ring-1 ring-navy/10",
    danger: "bg-gradient-to-br from-danger-soft to-white text-danger ring-1 ring-danger/10",
    sky: "bg-gradient-to-br from-info-soft to-white text-info ring-1 ring-info/10",
    violet: "bg-gradient-to-br from-[#f5f3ff] to-white text-[#5b21b6] ring-1 ring-[#5b21b6]/10",
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

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "success" | "warning" | "danger" | "info" | "teal" | "primary";
}) {
  const tones = {
    neutral: "bg-navy-050 text-ink-600 ring-1 ring-navy/5",
    success: "bg-success-soft text-success ring-1 ring-success/10",
    warning: "bg-warning-soft text-warning ring-1 ring-warning/10",
    danger: "bg-danger-soft text-danger ring-1 ring-danger/10",
    info: "bg-info-soft text-info ring-1 ring-info/10",
    teal: "bg-mint-soft text-teal-600 ring-1 ring-teal/10",
    primary: "bg-gradient-to-r from-teal to-mint text-white shadow-sm",
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
    teal: "from-mint/10 to-white",
    mint: "from-[#eafaf3] to-white",
    navy: "from-navy-050 to-white",
    danger: "from-danger-soft to-white",
    sky: "from-info-soft to-white",
    violet: "from-[#f5f3ff] to-white",
    success: "from-success-soft to-white",
  } as const;
 
  return (
    <Card className={cn("relative overflow-hidden p-6", className)}>
      <div className={cn("absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br blur-3xl", tones[tone])} />
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-ink-300">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
          {change ? <p className="mt-1 text-sm text-ink-400">{change}</p> : null}
        </div>
        <IconBadge icon={Icon} tone={tone === "violet" ? "violet" : tone === "sky" ? "sky" : tone === "danger" ? "danger" : tone === "navy" ? "navy" : tone === "mint" ? "mint" : "teal"} />
      </div>
    </Card>
  );
}

