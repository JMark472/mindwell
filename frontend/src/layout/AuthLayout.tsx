import { Card } from "@/components/ui/Primitives";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import { HeartPulse, LifeBuoy, MessageSquare, ShieldCheck, Sparkles } from "lucide-react";
import { NavLink, Outlet } from "react-router";

export default function AuthLayout({ children }: { children?: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-canvas">
      <AnimatedBackground />

      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 items-center gap-10 px-4 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <div className="hidden flex-col gap-8 lg:flex">
          <div className="flex items-center gap-3">
            <div className="mw-float flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 shadow-card ring-1 ring-white/70 backdrop-blur-xl">
              <img src="/logo.png" alt="Mindwell" className="h-9 w-9 rounded-field object-cover" />
            </div>
            <div>
              <p className="text-sm font-semibold">Mindwell</p>
              <p className="text-xs text-ink-400">Student mental wellness & counseling support</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <p className="text-xs uppercase tracking-[0.4em] text-ink-300">A calmer campus starts here</p>
            <h1 className="mw-gradient-text text-4xl font-semibold leading-tight xl:text-5xl">
              Care that feels human, private, and always within reach
            </h1>
            <p className="max-w-xl text-base text-ink-400">
              Connect with trained counselors, track your wellbeing, and access curated resources — all in one secure, student-first space.
            </p>
          </div>

          <div className="grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="mw-card-glass flex items-start gap-3 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-mint-soft text-teal-600">
                <HeartPulse aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">Mood check-ins</p>
                <p className="mt-1 text-xs text-ink-400">Private reflections, shared only when you choose.</p>
              </div>
            </div>
            <div className="mw-card-glass flex items-start gap-3 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-info-soft text-info">
                <MessageSquare aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">Secure messaging</p>
                <p className="mt-1 text-xs text-ink-400">Direct, encrypted conversations with counselors.</p>
              </div>
            </div>
            <div className="mw-card-glass flex items-start gap-3 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-navy-050 text-navy">
                <Sparkles aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">Guided support</p>
                <p className="mt-1 text-xs text-ink-400">Pragmatic tools for stress, rest, and resilience.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-md flex-col">
          <div className="mb-6 flex flex-col items-center text-center lg:hidden">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/80 shadow-card ring-1 ring-white/70 backdrop-blur-xl">
              <img
                src="/logo.png"
                alt="Mindwell"
                className="h-10 w-10 rounded-field object-cover"
              />
            </div>
            <p className="text-sm font-semibold">Mindwell</p>
            <p className="text-xs text-ink-400">
              Student mental wellness &amp; counseling support
            </p>
          </div>

          <Card className="mw-rise relative overflow-hidden border-white/70 bg-white/90 p-8 shadow-lift backdrop-blur-xl">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal/40 to-transparent" />
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
              className="inline-flex items-center gap-1.5 font-medium text-teal transition-colors hover:text-teal-600 hover:underline"
            >
              <LifeBuoy aria-hidden="true" strokeWidth={1.8} className="h-3.5 w-3.5" />
              Need urgent help? View crisis resources
            </NavLink>
          </p>
        </div>
      </div>
    </div>
  );
}
