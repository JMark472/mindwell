import { BookOpen } from "lucide-react";

export function resolveResourceImage(url?: string | null) {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }
  let base = ((import.meta as any).env?.VITE_EXPRESS_API_URL || "http://localhost:3000").replace(/\/$/, "");
  if (typeof window !== "undefined") {
    const hostIsLocalPage = /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);
    const baseIsLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(base);
    if (!hostIsLocalPage && baseIsLocalhost) {
      base = base.replace(/localhost|127\.0\.0\.1/i, window.location.hostname);
    }
  }
  return `${base}${url.startsWith("/") ? url : `/${url}`}`;
}

export function ResourceCover({
  src,
  alt,
  title,
  className = "",
  iconClassName = "h-8 w-8",
  compact = false,
}: {
  src?: string | null;
  alt: string;
  title?: string;
  className?: string;
  iconClassName?: string;
  compact?: boolean;
}) {
  const resolved = resolveResourceImage(src);
  if (resolved) {
    return <img src={resolved} alt={alt} className={`h-full w-full object-cover ${className}`} loading="lazy" />;
  }
  return (
    <div className={`relative h-full w-full overflow-hidden bg-gradient-to-br from-teal/25 via-mint/15 to-navy/20 ${className}`}>
      <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-mint/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 left-6 h-32 w-32 rounded-full bg-teal/25 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.12]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)", backgroundSize: "20px 20px" }} />
      <div className="relative z-10 flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
        <div className={`flex items-center justify-center rounded-2xl bg-white/70 text-teal shadow-card ring-1 ring-white/60 backdrop-blur ${compact ? "h-11 w-11" : "h-14 w-14"}`}>
          <BookOpen className={iconClassName} />
        </div>
        {!compact && title ? <p className="line-clamp-2 max-w-[14rem] text-xs font-medium text-navy/80 sm:text-sm">{title}</p> : null}
      </div>
    </div>
  );
}
