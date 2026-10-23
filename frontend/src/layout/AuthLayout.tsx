import { Card } from "@/components/ui/Primitives";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import { LifeBuoy, ShieldCheck } from "lucide-react";
import { NavLink, Outlet } from "react-router";

export default function AuthLayout({ children }: { children?: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-4 py-10">
      <AnimatedBackground />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 rounded-2xl bg-surface/80 p-1.5 shadow-card ring-1 ring-white/60 backdrop-blur">
            <img
              src="/logo.png"
              alt="Mindwell"
              className="h-12 w-12 rounded-field object-cover"
            />
          </div>
          <p className="text-sm font-semibold">Mindwell</p>
          <p className="text-xs text-ink-400">
            Student mental wellness &amp; counseling support
          </p>
        </div>

        <Card className="mw-rise bg-surface/95 p-8 shadow-lift backdrop-blur-sm">
          {children ?? <Outlet />}
        </Card>

        <p className="mt-6 flex items-start justify-center gap-1.5 text-center text-xs text-ink-400">
          <ShieldCheck
            aria-hidden="true"
            strokeWidth={1.8}
            className="mt-px h-3.5 w-3.5 shrink-0 text-teal"
          />
          <span>
            Mindwell is not a replacement for professional mental health care and
            is not an emergency response service.
          </span>
        </p>
        <p className="mt-3 text-center text-xs">
          <NavLink
            to="/help"
            className="inline-flex items-center gap-1.5 font-medium text-teal hover:underline"
          >
            <LifeBuoy aria-hidden="true" strokeWidth={1.8} className="h-3.5 w-3.5" />
            Need urgent help? View crisis resources
          </NavLink>
        </p>
      </div>
    </div>
  );
}
