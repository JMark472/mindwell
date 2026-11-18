import { useEffect, useState } from "react";
import { Link } from "react-router";
import { listResources, type WellnessResource } from "@/api/wellness";
import { Card, Button, IconBadge, Badge } from "@/components/ui/Primitives";
import { EmptyState, SkeletonCard } from "@/components/ui/Feedback";
import { useAuth } from "@/context/AuthContext";
import UserAvatar from "@/components/profile/UserAvatar";
import { ResourceCover } from "@/components/ui/ResourceCover";
import {
  ArrowRight,
  BookOpen,
  CalendarPlus,
  HeartPulse,
  MessageSquare,
  PhoneCall,
  ShieldAlert,
  Sparkles,
  Bot,
  Video,
} from "lucide-react";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [resources, setResources] = useState<WellnessResource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listResources({ featured: true })
      .then((result) => setResources(result.resources.slice(0, 3)))
      .finally(() => setLoading(false));
  }, []);

  const firstName = user?.fullName?.split(" ")[0] ?? "there";

  return (
    <div className="flex flex-col gap-6">
      <div className="relative overflow-hidden rounded-[24px] border border-white/20 bg-gradient-to-br from-navy via-[#102a4c] to-[#0b5e88] p-5 text-white shadow-lift ring-1 ring-white/10 sm:rounded-[28px] sm:p-7 lg:p-8">
        <div className="absolute -right-16 -top-14 h-44 w-44 rounded-full bg-mint/25 blur-3xl sm:-right-24 sm:-top-20 sm:h-72 sm:w-72" />
        <div className="absolute -bottom-20 -left-8 h-52 w-52 rounded-full bg-sky/20 blur-3xl sm:-bottom-28 sm:left-1/4 sm:h-80 sm:w-80" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_45%)]" />
        <div className="mw-grid-lines absolute inset-0 opacity-20 sm:opacity-25" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.10]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)", backgroundSize: "22px 22px" }} />
        <svg className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 w-full opacity-20 sm:h-24" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,40 C150,90 350,0 600,50 C850,100 1050,20 1200,60 L1200,120 L0,120 Z" fill="rgba(255,255,255,0.30)" />
          <path d="M0,70 C200,20 400,110 600,70 C800,30 1000,100 1200,80 L1200,120 L0,120 Z" fill="rgba(125,211,252,0.28)" />
        </svg>
        <div className="pointer-events-none absolute right-4 top-4 hidden gap-2 text-white/15 sm:right-6 sm:top-6 sm:flex sm:gap-3">
          <HeartPulse className="h-5 w-5 sm:h-7 sm:w-7" />
          <MessageSquare className="h-5 w-5 sm:h-7 sm:w-7" />
          <PhoneCall className="h-5 w-5 sm:h-7 sm:w-7" />
        </div>
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <Badge tone="teal" className="w-fit max-w-full border border-white/20 bg-white/10 px-3 py-1 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
              <Sparkles aria-hidden="true" className="mr-1 h-3 w-3 shrink-0" />
              Your space to reset
            </Badge>
            <div className="flex items-center gap-3 sm:gap-4">
              <UserAvatar
                user={{ fullName: user?.fullName ?? "Student", avatarUrl: user?.avatarUrl ?? null }}
                size="lg"
                className="h-12 w-12 shrink-0 ring-2 ring-white/40 shadow-[0_20px_60px_-30px_rgba(255,255,255,0.8)] sm:h-14 sm:w-14"
              />
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/70 sm:text-sm sm:normal-case sm:tracking-normal">{getGreeting()}, {firstName}</p>
                <h2 className="mt-1 text-xl font-semibold leading-tight tracking-tight text-white sm:text-2xl lg:text-3xl">
                  Take care of your mind today
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base">
                  Small check-ins go a long way. Book a session, reflect privately, or explore calming resources at your pace.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap sm:items-center">
              <Button asChild variant="glass" className="w-full justify-center border-white/40 bg-white/95 text-navy hover:bg-white sm:w-auto">
                <Link to="/student/appointments/book">
                  Find a counselor
                  <ArrowRight aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-center text-white hover:bg-white/10 sm:w-auto">
                <Link to="/student/check-in">
                  Start mood check-in
                  <HeartPulse aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-center text-white hover:bg-white/10 sm:w-auto">
                <Link to="/student/messages">
                  Message a counselor
                  <MessageSquare aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
          <div className="mw-float relative hidden h-40 w-40 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-xl lg:flex xl:h-44 xl:w-44">
            <div className="absolute inset-6 rounded-full bg-gradient-to-br from-sky/40 to-white/10" />
            <HeartPulse aria-hidden="true" className="relative h-11 w-11 text-white xl:h-12 xl:w-12" />
          </div>
        </div>
      </div>

      <Card className="relative flex flex-col gap-4 overflow-hidden border-danger/25 !bg-none bg-gradient-to-r from-danger-soft via-white to-white p-6 md:flex-row md:items-center md:justify-between">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-danger/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-danger/70 to-danger/30" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgb(180 35 24) 1px, transparent 0)", backgroundSize: "18px 18px" }} />
        <div className="relative z-10 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-danger/10 text-danger ring-1 ring-danger/15">
            <ShieldAlert aria-hidden="true" className="h-6 w-6" />
          </div>
          <div>
            <div className="mb-1 inline-flex rounded-pill bg-danger/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-danger">Urgent support</div>
            <h2 className="text-lg font-semibold text-ink">Need urgent help?</h2>
            <p className="mt-1 max-w-2xl text-sm text-ink-600">
              MindWell is not an emergency service. If you are in immediate danger, call your local emergency number or go to the nearest emergency room now.
            </p>
          </div>
        </div>
        <Button asChild variant="danger" className="relative z-10 shrink-0 md:self-center">
          <Link to="/student/help">
            View crisis resources
            <ArrowRight aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
          </Link>
        </Button>
      </Card>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <BookOpen aria-hidden="true" strokeWidth={1.8} className="h-5 w-5 text-teal" />
              Featured resources
            </h2>
            <p className="mt-1 text-sm text-ink-400">Calm, actionable guides curated for students.</p>
          </div>
          <Button asChild variant="secondary">
            <Link to="/student/resources">
              View all
              <ArrowRight aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : resources.length === 0 ? (
          <EmptyState
            title="No resources yet"
            description="Check back soon for wellness guides and coping tools."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {resources.map((resource) => (
              <Card key={resource.id} hover className="group overflow-hidden p-0">
                <Link to={`/student/resources/${resource.slug}`} className="flex h-full flex-col">
                  <div className="relative h-36 w-full overflow-hidden">
                    <div className="h-full w-full transition-transform duration-500 group-hover:scale-[1.03]">
                      <ResourceCover src={resource.cover_image} alt={resource.title} title={resource.title} compact iconClassName="h-6 w-6" />
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-ink-300">
                        {resource.category?.name ?? "Resource"}
                      </p>
                      <Badge tone="teal">{resource.reading_minutes ?? 3} min</Badge>
                    </div>
                    <h3 className="mt-3 text-base font-semibold text-ink transition-colors group-hover:text-teal-700">{resource.title}</h3>
                    <p className="mt-2 flex-1 text-sm text-ink-400 line-clamp-3">{resource.excerpt}</p>
                    <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-teal">
                      Read article
                      <ArrowRight aria-hidden="true" strokeWidth={1.8} className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold">Quick Actions</h2>
          <p className="text-sm text-ink-400">Access your wellness tools and support services</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="group cursor-pointer p-5 transition-all hover:shadow-lift">
            <Link to="/student/appointments/book" className="flex flex-col gap-3">
              <IconBadge icon={CalendarPlus} tone="teal" />
              <div>
                <h3 className="font-semibold group-hover:text-teal-600">Book Counseling</h3>
                <p className="mt-1 text-sm text-ink-400">Find and book a counselor</p>
              </div>
            </Link>
          </Card>
          <Card className="group cursor-pointer p-5 transition-all hover:shadow-lift">
            <Link to="/student/check-in" className="flex flex-col gap-3">
              <IconBadge icon={HeartPulse} tone="mint" />
              <div>
                <h3 className="font-semibold group-hover:text-teal-600">Mood Check-In</h3>
                <p className="mt-1 text-sm text-ink-400">Track your daily wellbeing</p>
              </div>
            </Link>
          </Card>
          <Card className="group cursor-pointer p-5 transition-all hover:shadow-lift">
            <Link to="/student/assistant" className="flex flex-col gap-3">
              <IconBadge icon={Bot} tone="violet" />
              <div>
                <h3 className="font-semibold group-hover:text-teal-600">AI Assistant</h3>
                <p className="mt-1 text-sm text-ink-400">Get instant wellness support</p>
              </div>
            </Link>
          </Card>
          <Card className="group cursor-pointer p-5 transition-all hover:shadow-lift">
            <Link to="/student/callsessions" className="flex flex-col gap-3">
              <IconBadge icon={Video} tone="sky" />
              <div>
                <h3 className="font-semibold group-hover:text-teal-600">Call Sessions</h3>
                <p className="mt-1 text-sm text-ink-400">Join your sessions</p>
              </div>
            </Link>
          </Card>
        </div>
      </section>
    </div>
  );
}
