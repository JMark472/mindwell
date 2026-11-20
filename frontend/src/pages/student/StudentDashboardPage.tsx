import { useEffect, useState } from "react";
import { Link } from "react-router";
import { listResources, type WellnessResource } from "@/api/wellness";
import { Card, Button, IconBadge, Badge } from "@/components/ui/Primitives";
import { EmptyState, SkeletonCard } from "@/components/ui/Feedback";
import DashboardHero from "@/components/ui/DashboardHero";
import { useAuth } from "@/context/AuthContext";
import { ResourceCover } from "@/components/ui/ResourceCover";
import {
  ArrowRight,
  BookOpen,
  CalendarPlus,
  HeartPulse,
  MessageSquare,
  ShieldAlert,
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
      <DashboardHero
        eyebrow="Your space to reset"
        greeting={`${getGreeting()}, ${firstName}`}
        title="Take care of your mind today"
        description="Small check-ins go a long way. Book a session, reflect privately, or explore calming resources at your pace."
        avatar={{ name: user?.fullName ?? "Student", url: user?.avatarUrl ?? null }}
        icon={HeartPulse}
        actions={
          <>
            <Button asChild className="w-full justify-center sm:w-auto">
              <Link to="/student/appointments/book">
                Find a counselor
                <ArrowRight aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary" className="w-full justify-center sm:w-auto">
              <Link to="/student/check-in">
                Start mood check-in
                <HeartPulse aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-center sm:w-auto">
              <Link to="/student/messages">
                Message a counselor
                <MessageSquare aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
              </Link>
            </Button>
          </>
        }
      />

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
