import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Card, Button, Badge, IconBadge } from "@/components/ui/Primitives";
import { EmptyState } from "@/components/ui/Feedback";
import { listAppointments, type Appointment } from "@/api/appointments";
import { formatDateTime } from "@/components/ui/Helpers";
import { Video, Calendar, Clock, Phone, ArrowRight, Sparkles } from "lucide-react";
import InPageCall, { type InPageCallInfo } from "@/components/ui/InPageCall";
import { useAuth } from "@/context/AuthContext";

function initials(name?: string | null) {
  if (!name) return "C";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("") || "C";
}

function statusTone(status?: string) {
  if (status === "completed") return "success" as const;
  if (status === "confirmed") return "teal" as const;
  if (status === "cancelled") return "danger" as const;
  return "neutral" as const;
}

export default function CallSessionsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCall, setActiveCall] = useState<InPageCallInfo | null>(null);

  useEffect(() => {
    listAppointments()
      .then(setAppointments)
      .finally(() => setLoading(false));
  }, []);

  const sessions = useMemo(
    () => appointments.filter((a) => a.mode === "online" || a.mode === "in_person"),
    [appointments],
  );

  const upcoming = useMemo(
    () =>
      sessions
        .filter((a) => a.status === "confirmed" && new Date(a.slot_start) > new Date())
        .sort((a, b) => +new Date(a.slot_start) - +new Date(b.slot_start)),
    [sessions],
  );

  const past = useMemo(
    () =>
      sessions
        .filter((a) => a.status === "completed" || a.status === "cancelled" || new Date(a.slot_start) <= new Date())
        .sort((a, b) => +new Date(b.slot_start) - +new Date(a.slot_start)),
    [sessions],
  );

  const nextSession = upcoming[0];

  return (
    <div className="flex flex-col gap-6">
      <Card hover={false} className="relative overflow-hidden border-0 bg-gradient-to-br from-navy via-navy-800 to-teal-700 p-6 text-white shadow-lift sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-mint/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-10 h-48 w-48 rounded-full bg-teal/30 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-pill bg-white/10 px-3 py-1 text-xs font-medium text-white/90 ring-1 ring-white/15 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Private & secure sessions
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Call Sessions</h2>
            <p className="mt-2 text-sm text-white/75 sm:text-base">
              Join your scheduled audio or video counseling sessions in one place. When it’s time, start your call right from this page.
            </p>
            {nextSession ? (
              <div className="mt-5 inline-flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-white/10 px-4 py-3 text-sm ring-1 ring-white/15 backdrop-blur">
                <span className="font-medium text-white">Next session</span>
                <span className="text-white/80">{nextSession.counselor_name || "Counselor"}</span>
                <span className="text-white/70">{formatDateTime(nextSession.slot_start)}</span>
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="bg-white text-navy hover:bg-white/90 shadow-none">
              <Link to="/student/appointments/book">
                <Calendar className="h-4 w-4" />
                Book a Session
              </Link>
            </Button>
            <Button asChild variant="ghost" className="border border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
              <Link to="/student/appointments">View Appointments</Link>
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-ink-300">Upcoming</p>
              <p className="mt-2 text-3xl font-semibold">{upcoming.length}</p>
              <p className="mt-1 text-xs text-ink-400">Ready to join</p>
            </div>
            <IconBadge icon={Calendar} tone="teal" />
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-ink-300">Completed</p>
              <p className="mt-2 text-3xl font-semibold">{sessions.filter((s) => s.status === "completed").length}</p>
              <p className="mt-1 text-xs text-ink-400">Sessions finished</p>
            </div>
            <IconBadge icon={Video} tone="mint" />
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-ink-300">Total</p>
              <p className="mt-2 text-3xl font-semibold">{sessions.length}</p>
              <p className="mt-1 text-xs text-ink-400">All call sessions</p>
            </div>
            <IconBadge icon={Clock} tone="navy" />
          </div>
        </Card>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Upcoming sessions</h3>
            <p className="text-sm text-ink-400">Join when your counselor is ready</p>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[0, 1].map((i) => (
              <Card key={i} className="animate-pulse p-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-navy-050" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/2 rounded bg-navy-050" />
                    <div className="h-3 w-1/3 rounded bg-navy-050" />
                  </div>
                </div>
                <div className="mt-5 space-y-2">
                  <div className="h-3 w-2/3 rounded bg-navy-050" />
                  <div className="h-3 w-1/2 rounded bg-navy-050" />
                </div>
                <div className="mt-5 h-10 rounded-field bg-navy-050" />
              </Card>
            ))}
          </div>
        ) : upcoming.length === 0 ? (
          <EmptyState
            title="No upcoming sessions"
            description="You don’t have a confirmed call session right now. Book a time that works for you."
            action={<Button asChild><Link to="/student/appointments/book">Book a Session</Link></Button>}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {upcoming.map((session) => (
              <Card key={session.id} className="group relative overflow-hidden p-6">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal via-mint to-teal/40" />
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal/10 to-mint/20 text-sm font-semibold text-teal-700 ring-1 ring-teal/10">
                      {initials(session.counselor_name)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{session.counselor_name || "Counselor"}</p>
                      <p className="text-sm text-ink-400">Counseling session</p>
                    </div>
                  </div>
                  <Badge tone="teal" className="shrink-0 capitalize">{session.mode === "online" ? "Online" : "In person"}</Badge>
                </div>

                <div className="mt-5 grid gap-2 rounded-2xl bg-surface-2/70 p-4 text-sm text-ink-600 ring-1 ring-line/60">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-teal" />
                    <span>{formatDateTime(session.slot_start)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-teal" />
                    <span>60 minutes</span>
                  </div>
                </div>

                <div className="mt-5 flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      const room = `Mindwell-Appointment-${session.id}`;
                      setActiveCall({
                        room,
                        video: true,
                        name: session.counselor_name || "Counseling session",
                      });
                    }}
                  >
                    <Video className="h-4 w-4" />
                    Join video
                  </Button>
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => {
                      const room = `Mindwell-Appointment-${session.id}`;
                      setActiveCall({
                        room,
                        video: false,
                        name: session.counselor_name || "Counseling session",
                      });
                    }}
                  >
                    <Phone className="h-4 w-4" />
                    Audio
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-semibold">Session history</h3>
          <p className="text-sm text-ink-400">Your past and completed sessions</p>
        </div>

        {loading ? (
          <Card className="p-6 text-sm text-ink-400">Loading history…</Card>
        ) : past.length === 0 ? (
          <EmptyState
            title="No past sessions"
            description="Completed and previous sessions will appear here."
          />
        ) : (
          <Card hover={false} className="overflow-hidden">
            <ul className="divide-y divide-line/70">
              {past.map((session) => (
                <li key={session.id} className="group flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-surface-2/50 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-050 text-xs font-semibold text-navy ring-1 ring-line/60">
                      {initials(session.counselor_name)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{session.counselor_name || "Counselor"}</p>
                      <p className="truncate text-sm text-ink-400">
                        {formatDateTime(session.slot_start)} · {session.mode === "online" ? "Online" : "In person"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <Badge tone={statusTone(session.status)} className="capitalize">{session.status}</Badge>
                    <Button asChild variant="ghost" size="sm">
                      <Link to={`/student/appointments/${session.id}`}>
                        Details <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>

      {activeCall ? (
        <InPageCall
          call={activeCall}
          displayName={user?.fullName || "Mindwell User"}
          onClose={() => setActiveCall(null)}
        />
      ) : null}
    </div>
  );
}
