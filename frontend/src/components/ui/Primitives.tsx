import React from "react";
import { cn } from "@/utils/cn";

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
