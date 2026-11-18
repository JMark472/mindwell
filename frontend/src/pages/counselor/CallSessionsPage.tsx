import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Card, Button, Badge, IconBadge } from "@/components/ui/Primitives";
import { EmptyState } from "@/components/ui/Feedback";
import { listAppointments, type Appointment } from "@/api/appointments";
import { formatDateTime } from "@/components/ui/Helpers";
import { Video, Calendar, Clock, Users, Plus, Phone, ArrowRight, Sparkles, HeartPulse, ShieldCheck } from "lucide-react";
import InPageCall, { type InPageCallInfo } from "@/components/ui/InPageCall";
import { useAuth } from "@/context/AuthContext";
import UserAvatar from "@/components/profile/UserAvatar";

export default function CounselorCallSessionsPage() {
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

  const today = useMemo(
    () =>
      upcoming.filter((a) => new Date(a.slot_start).toDateString() === new Date().toDateString()),
    [upcoming],
  );

  const nextSession = upcoming[0];

  return (
    <div className="flex flex-col gap-6">
      <Card hover={false} className="relative overflow-hidden border-0 bg-gradient-to-br from-navy via-navy-800 to-teal-700 p-6 text-white shadow-lift sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-mint/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-10 h-48 w-48 rounded-full bg-teal/30 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.12]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)", backgroundSize: "22px 22px" }} />
        <svg className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 w-full opacity-20" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,40 C150,90 350,0 600,50 C850,100 1050,20 1200,60 L1200,120 L0,120 Z" fill="rgba(255,255,255,0.35)" />
          <path d="M0,70 C200,20 400,110 600,70 C800,30 1000,100 1200,80 L1200,120 L0,120 Z" fill="rgba(82,208,176,0.35)" />
        </svg>
        <div className="pointer-events-none absolute right-6 top-6 hidden gap-3 text-white/20 sm:flex">
          <Video className="h-8 w-8" />
          <HeartPulse className="h-8 w-8" />
          <ShieldCheck className="h-8 w-8" />
        </div>
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-pill bg-white/10 px-3 py-1 text-xs font-medium text-white/90 ring-1 ring-white/15 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Counselor workspace
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Call Sessions</h2>
            <p className="mt-2 text-sm text-white/75 sm:text-base">
              Start and manage your counseling calls in one place. Open a session to connect with students securely.
            </p>
            {nextSession ? (
              <div className="mt-5 inline-flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-white/10 px-4 py-3 text-sm ring-1 ring-white/15 backdrop-blur">
                <span className="font-medium text-white">Next up</span>
                <span className="text-white/80">{nextSession.student_name || "Student"}</span>
                <span className="text-white/70">{formatDateTime(nextSession.slot_start)}</span>
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="bg-white text-navy hover:bg-white/90 shadow-none">
              <Link to="/counselor/schedule">
                <Plus className="h-4 w-4" />
                Schedule Session
              </Link>
            </Button>
            <Button asChild variant="ghost" className="border border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
              <Link to="/counselor/appointments">Appointments</Link>
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-ink-300">Today</p>
              <p className="mt-2 text-3xl font-semibold">{today.length}</p>
              <p className="mt-1 text-xs text-ink-400">Sessions today</p>
            </div>
            <IconBadge icon={Clock} tone="sky" />
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-ink-300">Upcoming</p>
              <p className="mt-2 text-3xl font-semibold">{upcoming.length}</p>
              <p className="mt-1 text-xs text-ink-400">Confirmed ahead</p>
            </div>
            <IconBadge icon={Calendar} tone="teal" />
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-ink-300">Total</p>
              <p className="mt-2 text-3xl font-semibold">{sessions.length}</p>
              <p className="mt-1 text-xs text-ink-400">All call sessions</p>
            </div>
            <IconBadge icon={Users} tone="navy" />
          </div>
        </Card>
      </div>

      <section className="flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-semibold">Upcoming sessions</h3>
          <p className="text-sm text-ink-400">Start a video or audio call when you’re ready</p>
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
            description="Confirmed student sessions will appear here when scheduled."
            action={<Button asChild><Link to="/counselor/schedule">Manage Schedule</Link></Button>}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {upcoming.map((session) => (
              <Card key={session.id} className="group relative overflow-hidden p-6">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal via-mint to-teal/40" />
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <UserAvatar
                      user={{ fullName: session.student_name || "Student", avatarUrl: session.student_avatar_url ?? null }}
                      size="lg"
                      className="ring-2 ring-white shadow-sm"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{session.student_name || "Student"}</p>
                      <p className="truncate text-sm text-ink-400">{session.concern_category || "Counseling session"}</p>
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
                        name: session.student_name || "Student session",
                      });
                    }}
                  >
                    <Video className="h-4 w-4" />
                    Start video
                  </Button>
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => {
                      const room = `Mindwell-Appointment-${session.id}`;
                      setActiveCall({
                        room,
                        video: false,
                        name: session.student_name || "Student session",
                      });
                    }}
                  >
                    <Phone className="h-4 w-4" />
                    Audio
                  </Button>
                </div>
                <div className="mt-2">
                  <Button asChild variant="ghost" size="sm" className="w-full justify-center">
                    <Link to={`/counselor/cases?student=${session.student_user_id}`}>
                      View student case <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
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
