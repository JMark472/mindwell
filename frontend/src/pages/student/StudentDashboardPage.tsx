import { useEffect, useState } from "react";
import { Link } from "react-router";
import { listResources, type WellnessResource } from "@/api/wellness";
import { Card, Button, IconBadge } from "@/components/ui/Primitives";
import { EmptyState, SkeletonCard } from "@/components/ui/Feedback";
import {
  ArrowRight,
  BookOpen,
  CalendarPlus,
  HeartPulse,
  ShieldAlert,
} from "lucide-react";

export default function StudentDashboardPage() {
  const [resources, setResources] = useState<WellnessResource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listResources({ featured: true })
      .then((result) => setResources(result.resources.slice(0, 3)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col gap-3 border-danger/20 bg-gradient-to-r from-danger-soft/70 to-surface p-6 md:flex-row md:items-center md:justify-between">
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
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <BookOpen aria-hidden="true" strokeWidth={1.8} className="h-5 w-5 text-teal" />
            Featured resources
          </h2>
          <Button asChild variant="ghost">
            <Link to="/student/resources">
              View all
              <ArrowRight aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        {loading ? (
          <div className="grid gap-4 md:grid-cols-3">
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
          <div className="grid gap-4 md:grid-cols-3">
            {resources.map((resource) => (
              <Card key={resource.id} className="mw-card-hover flex flex-col p-6">
                <p className="text-[11px] uppercase tracking-[0.18em] text-ink-300">
                  {resource.category?.name ?? "Resource"}
                </p>
                <h3 className="mt-2 text-base font-semibold">{resource.title}</h3>
                <p className="mt-2 flex-1 text-sm text-ink-400">{resource.excerpt}</p>
                <Button asChild variant="ghost" className="mt-4 self-start px-0">
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

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="mw-card-hover p-6">
          <IconBadge icon={CalendarPlus} />
          <h3 className="mt-4 text-base font-semibold">Book counseling</h3>
          <p className="mt-1 text-sm text-ink-400">
            Browse available counselors and request an appointment.
          </p>
          <Button asChild className="mt-4">
            <Link to="/student/appointments/book">
              Find a counselor
              <ArrowRight aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
            </Link>
          </Button>
        </Card>
        <Card className="mw-card-hover p-6">
          <IconBadge icon={HeartPulse} tone="mint" />
          <h3 className="mt-4 text-base font-semibold">Daily mood check-in</h3>
          <p className="mt-1 text-sm text-ink-400">
            A private reflection tool. You choose whether to share with a counselor.
          </p>
          <Button asChild variant="secondary" className="mt-4">
            <Link to="/student/check-in">
              Start check-in
              <ArrowRight aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
            </Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}
