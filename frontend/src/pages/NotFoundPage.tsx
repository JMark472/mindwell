import { Link } from "react-router";
import { Compass, Home, LifeBuoy } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-4 py-10">
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-teal/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-mint/20 blur-3xl" />
      <div className="mw-card relative w-full max-w-lg p-8 text-center sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal/15 to-mint/20 text-teal ring-1 ring-teal/20">
          <Compass className="h-8 w-8" />
        </div>
        <p className="mt-5 text-sm font-semibold uppercase tracking-[0.24em] text-teal">404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Page not found</h1>
        <p className="mt-2 text-sm text-ink-400">
          The page you’re looking for doesn’t exist, may have been moved, or the link may be incorrect.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Link
            to="/"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-field bg-primary-dark px-4 text-sm font-medium text-white shadow-[0_10px_40px_-18px_rgba(16,169,155,1)] transition-all hover:bg-primary-deep"
          >
            <Home className="h-4 w-4" /> Back to home
          </Link>
          <Link
            to="/help"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-field border border-line/80 bg-white/90 px-4 text-sm font-medium text-ink shadow-card transition-all hover:bg-white"
          >
            <LifeBuoy className="h-4 w-4" /> Help & crisis
          </Link>
        </div>
      </div>
    </div>
  );
}
