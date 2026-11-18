import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Card, Button, Badge, IconBadge } from "@/components/ui/Primitives";
import { EmptyState } from "@/components/ui/Feedback";
import { listAppointments, type Appointment } from "@/api/appointments";
import { formatDateTime } from "@/components/ui/Helpers";
import { Video, Calendar, Clock, Phone, ArrowRight, Sparkles, HeartPulse, ShieldCheck } from "lucide-react";
import InPageCall, { type InPageCallInfo } from "@/components/ui/InPageCall";
import { useAuth } from "@/context/AuthContext";
import UserAvatar from "@/components/profile/UserAvatar";

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
      <Card hover={false} className="relative overflow-hidden border-0 !bg-none bg-gradient-to-br from-navy via-[#102a4c] to-teal p-5 text-white shadow-lift ring-1 ring-white/10 sm:p-7 lg:p-8">
        <div className="pointer-events-none absolute -right-16 -top-14 h-44 w-44 rounded-full bg-mint/25 blur-3xl sm:-right-24 sm:-top-20 sm:h-72 sm:w-72" />
        <div className="pointer-events-none absolute -bottom-20 -left-8 h-52 w-52 rounded-full bg-sky/20 blur-3xl sm:-bottom-28 sm:left-1/4 sm:h-80 sm:w-80" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_45%)]" />
        <div className="mw-grid-lines pointer-events-none absolute inset-0 opacity-20 sm:opacity-25" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.10]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)", backgroundSize: "22px 22px" }} />
        <svg className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 w-full opacity-20 sm:h-24" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,40 C150,90 350,0 600,50 C850,100 1050,20 1200,60 L1200,120 L0,120 Z" fill="rgba(255,255,255,0.30)" />
          <path d="M0,70 C200,20 400,110 600,70 C800,30 1000,100 1200,80 L1200,120 L0,120 Z" fill="rgba(82,208,176,0.30)" />
        </svg>
        <div className="pointer-events-none absolute right-4 top-4 hidden gap-2 text-white/15 sm:right-6 sm:top-6 sm:flex sm:gap-3">
          <Video className="h-5 w-5 sm:h-7 sm:w-7" />
          <HeartPulse className="h-5 w-5 sm:h-7 sm:w-7" />
          <ShieldCheck className="h-5 w-5 sm:h-7 sm:w-7" />
        </div>
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl min-w-0 flex-1">
            <div className="mb-3 inline-flex max-w-full items-center gap-2 rounded-pill bg-white/10 px-3 py-1 text-xs font-medium text-white/90 ring-1 ring-white/15 backdrop-blur shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              Private & secure sessions
            </div>
            <h2 className="text-xl font-semibold leading-tight tracking-tight text-white sm:text-2xl lg:text-3xl">Call Sessions</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/80 sm:text-base">
              Join your scheduled audio or video counseling sessions in one place. When it’s time, start your call right from this page.
            </p>
            {nextSession ? (
              <div className="mt-4 flex w-full flex-col gap-1.5 rounded-2xl bg-white/10 px-4 py-3 text-sm ring-1 ring-white/15 backdrop-blur sm:mt-5 sm:inline-flex sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-2">
                <span className="font-medium text-white">Next session</span>
                <span className="text-white/85">{nextSession.counselor_name || "Counselor"}</span>
                <span className="text-white/70">{formatDateTime(nextSession.slot_start)}</span>
              </div>
            ) : null}
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:gap-3">
            <Button asChild className="w-full justify-center bg-white text-navy shadow-none hover:bg-white/90 sm:w-auto">
              <Link to="/student/appointments/book">
                <Calendar className="h-4 w-4" />
                Book a Session
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-center border border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white sm:w-auto">
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
                    <UserAvatar
                      user={{ fullName: session.counselor_name || "Counselor", avatarUrl: session.counselor_avatar_url ?? null }}
                      size="lg"
                      className="ring-2 ring-white shadow-sm"
                    />
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
                    <UserAvatar
                      user={{ fullName: session.counselor_name || "Counselor", avatarUrl: session.counselor_avatar_url ?? null }}
                      size="md"
                    />
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
