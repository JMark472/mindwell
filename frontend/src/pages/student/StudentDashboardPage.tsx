import { useEffect, useState } from "react";
import { Link } from "react-router";
import { listResources, type WellnessResource } from "@/api/wellness";
import { Card, Button, IconBadge, Badge } from "@/components/ui/Primitives";
import { EmptyState, SkeletonCard } from "@/components/ui/Feedback";
import { useAuth } from "@/context/AuthContext";
import UserAvatar from "@/components/profile/UserAvatar";
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
      <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-gradient-to-br from-navy via-[#0f4d7a] to-teal p-6 text-white shadow-lift sm:p-8">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-mint/25 blur-3xl" />
        <div className="absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-sky/20 blur-3xl" />
        <div className="mw-grid-lines absolute inset-0 opacity-30" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.10]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)", backgroundSize: "22px 22px" }} />
        <svg className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 w-full opacity-20" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,40 C150,90 350,0 600,50 C850,100 1050,20 1200,60 L1200,120 L0,120 Z" fill="rgba(255,255,255,0.3)" />
          <path d="M0,70 C200,20 400,110 600,70 C800,30 1000,100 1200,80 L1200,120 L0,120 Z" fill="rgba(82,208,176,0.3)" />
        </svg>
        <div className="pointer-events-none absolute right-6 top-6 hidden gap-3 text-white/15 lg:hidden sm:flex">
          <HeartPulse className="h-7 w-7" />
          <MessageSquare className="h-7 w-7" />
          <PhoneCall className="h-7 w-7" />
        </div>
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3">
            <Badge tone="teal" className="w-fit border border-white/20 bg-white/10 text-white">
              <Sparkles aria-hidden="true" className="mr-1 h-3 w-3" />
              Your space to reset
            </Badge>
            <div className="flex items-center gap-4">
              <UserAvatar
                user={{ fullName: user?.fullName ?? "Student", avatarUrl: user?.avatarUrl ?? null }}
                size="xl"
                className="hidden ring-2 ring-white/40 shadow-[0_20px_60px_-30px_rgba(255,255,255,0.8)] sm:inline-flex"
              />
              <div>
                <p className="text-sm text-white/80">{getGreeting()}, {firstName}</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  Take care of your mind today
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-white/90">
                  Small check-ins go a long way. Book a session, reflect privately, or explore calming resources at your pace.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="glass" className="border-white/40 bg-white/90 text-navy hover:bg-white">
                <Link to="/student/appointments/book">
                  Find a counselor
                  <ArrowRight aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="ghost" className="text-white hover:bg-white/10">
                <Link to="/student/check-in">
                  Start mood check-in
                  <HeartPulse aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="ghost" className="text-white hover:bg-white/10">
                <Link to="/student/messages">
                  Message a counselor
                  <MessageSquare aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
          <div className="mw-float relative hidden h-44 w-44 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-xl lg:flex">
            <div className="absolute inset-6 rounded-full bg-gradient-to-br from-mint/40 to-white/10" />
            <HeartPulse aria-hidden="true" className="relative h-12 w-12 text-white" />
          </div>
        </div>
      </div>

      <Card className="flex flex-col gap-3 border-danger/20 bg-gradient-to-r from-danger-soft/80 via-white to-white p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <IconBadge icon={ShieldAlert} tone="danger" />
          <div>
            <h2 className="text-lg font-semibold">Need urgent help?</h2>
            <p className="mt-1 text-sm text-ink-400">
              Mindwell is not an emergency service. If you are in immediate danger,
              call your local emergency number or go to the nearest emergency room.
            </p>
          </div>
        </div>
        <Button asChild variant="danger">
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
              <Card key={resource.id} className="flex flex-col p-6">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-ink-300">
                    {resource.category?.name ?? "Resource"}
                  </p>
                  <Badge tone="teal">{resource.reading_minutes ?? 3} min</Badge>
                </div>
                <h3 className="mt-3 text-base font-semibold">{resource.title}</h3>
                <p className="mt-2 flex-1 text-sm text-ink-400">{resource.excerpt}</p>
                <Button asChild variant="ghost" className="mt-5 self-start px-0">
                  <Link to={`/student/resources/${resource.slug}`}>
                    Read article
                    <ArrowRight aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
                  </Link>
                </Button>
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
