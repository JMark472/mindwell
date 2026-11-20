import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Card, Button, Badge } from "@/components/ui/Primitives";
import { listAppointments, type Appointment } from "@/api/appointments";
import { formatDateTime } from "@/components/ui/Helpers";
import {
  Video,
  Calendar,
  Clock,
  Phone,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  CalendarDays,
  UserRound,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import InPageCall, { type InPageCallInfo } from "@/components/ui/InPageCall";
import { useAuth } from "@/context/AuthContext";
import UserAvatar from "@/components/profile/UserAvatar";

function statusBadgeTone(status?: string) {
  if (status === "completed") return "success" as const;
  if (status === "confirmed") return "teal" as const;
  if (status === "pending") return "warning" as const;
  if (status === "cancelled" || status === "declined") return "danger" as const;
  return "neutral" as const;
}

function statusLabel(status?: string) {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function sessionTypeLabel(mode?: string) {
  if (mode === "online") return "Audio / Video";
  if (mode === "in_person") return "In person";
  return "Session";
}

function canJoinSession(appt: Appointment) {
  if (appt.status !== "confirmed") return false;
  if (appt.mode !== "online") return false;
  const start = new Date(appt.slot_start).getTime();
  const end = new Date(appt.slot_end).getTime();
  const now = Date.now();
  const openFrom = start - 10 * 60 * 1000; // 10 minutes before
  const openUntil = Math.max(end, start + 2 * 60 * 60 * 1000); // until end or 2h after start
  return now >= openFrom && now <= openUntil;
}

function isUpcomingAppointment(appt: Appointment) {
  if (appt.status === "cancelled" || appt.status === "declined" || appt.status === "completed") return false;
  return new Date(appt.slot_end).getTime() >= Date.now();
}

function isHistoryAppointment(appt: Appointment) {
  if (appt.status === "completed" || appt.status === "cancelled" || appt.status === "declined") return true;
  return new Date(appt.slot_end).getTime() < Date.now();
}

const PAGE_SIZE = 6;

export default function CallSessionsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCall, setActiveCall] = useState<InPageCallInfo | null>(null);
  const [historyPage, setHistoryPage] = useState(1);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    listAppointments()
      .then((data) => {
        if (!mounted) return;
        setAppointments(Array.isArray(data) ? data : []);
      })
      .catch((err: any) => {
        if (!mounted) return;
        setError(err?.response?.data?.message || err?.message || "Unable to load call sessions. Please try again.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const upcoming = useMemo(
    () =>
      appointments
        .filter(isUpcomingAppointment)
        .sort((a, b) => +new Date(a.slot_start) - +new Date(b.slot_start)),
    [appointments],
  );

  const history = useMemo(
    () =>
      appointments
        .filter(isHistoryAppointment)
        .sort((a, b) => +new Date(b.slot_start) - +new Date(a.slot_start)),
    [appointments],
  );

  const upcomingConfirmedCount = useMemo(
    () => appointments.filter((a) => a.status === "confirmed" && new Date(a.slot_end).getTime() >= Date.now()).length,
    [appointments],
  );
  const completedCount = useMemo(() => appointments.filter((a) => a.status === "completed").length, [appointments]);
  const pendingCount = useMemo(() => appointments.filter((a) => a.status === "pending").length, [appointments]);

  const totalHistoryPages = Math.max(1, Math.ceil(history.length / PAGE_SIZE));
  const pagedHistory = useMemo(() => {
    const page = Math.min(historyPage, totalHistoryPages);
    const start = (page - 1) * PAGE_SIZE;
    return history.slice(start, start + PAGE_SIZE);
  }, [history, historyPage, totalHistoryPages]);

  useEffect(() => {
    setHistoryPage((p) => Math.min(Math.max(1, p), totalHistoryPages));
  }, [totalHistoryPages]);

  const nextSession = upcoming.find((a) => a.status === "confirmed") || upcoming[0];

  const startCall = (session: Appointment, video: boolean) => {
    const room = `Mindwell-Appointment-${session.id}`;
    setActiveCall({
      room,
      video,
      name: session.counselor_name || "Counseling session",
      details: {
        participantLabel: "Counselor",
        participantName: session.counselor_name || "Counselor",
        participantRole: "counselor",
        counterpartName: user?.fullName || "Student",
        counterpartRole: "student",
        scheduledAt: session.slot_start,
        durationLabel: "60 minutes",
        status: session.status,
        sessionType: session.mode === "online" ? (video ? "Online video session" : "Online audio session") : "In-person session",
      },
    });
  };

  return (
    <div className="flex flex-col gap-6 text-[#183B3A]">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[24px] border border-[#D7ECE6] bg-gradient-to-br from-[#E8F7F3] via-[#F3FBF8] to-[#DFF5EE] p-5 shadow-[0_18px_40px_-28px_rgba(13,148,136,0.35)] sm:p-7 lg:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#14B8A6]/15 blur-3xl sm:h-56 sm:w-56" />
        <div className="pointer-events-none absolute -bottom-14 left-8 h-44 w-44 rounded-full bg-[#0D9488]/10 blur-3xl sm:h-60 sm:w-60" />
        <div className="pointer-events-none absolute right-4 top-4 hidden gap-2 text-[#0D9488]/15 sm:flex">
          <Video className="h-7 w-7" />
          <ShieldCheck className="h-7 w-7" />
          <CalendarDays className="h-7 w-7" />
        </div>
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#BFE7DD] bg-white/80 px-3 py-1 text-xs font-semibold tracking-wide text-[#0D9488] shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5" />
              PRIVATE &amp; SECURE SESSIONS
            </div>
            <h2 className="mt-4 text-2xl font-semibold leading-tight tracking-tight text-[#183B3A] sm:text-3xl lg:text-[2rem]">
              Your Mental Wellness Matters
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#64748B] sm:text-base">
              Join your scheduled audio or video counseling sessions in a calm, secure space. When it&apos;s time, start your call directly from this page.
            </p>
            {nextSession ? (
              <div className="mt-4 inline-flex w-full min-w-0 flex-col gap-1 rounded-2xl border border-[#D7ECE6] bg-white/80 px-4 py-3 text-sm text-[#183B3A] shadow-sm backdrop-blur sm:w-auto sm:flex-row sm:items-center sm:gap-3">
                <span className="font-medium text-[#0D9488]">Next session</span>
                <span className="break-words text-[#64748B]">{nextSession.counselor_name || "Counselor"}</span>
                <span className="break-words text-[#64748B]">{formatDateTime(nextSession.slot_start)}</span>
              </div>
            ) : null}
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button asChild className="w-full justify-center bg-primary-dark text-white hover:bg-primary-deep sm:w-auto">
              <Link to="/student/appointments/book">
                <Calendar className="h-4 w-4" />
                Book a Session
              </Link>
            </Button>
            <Button asChild variant="secondary" className="w-full justify-center border-[#BFE7DD] bg-white text-[#183B3A] hover:bg-[#F5FAF9] sm:w-auto">
              <Link to="/student/appointments">
                <CalendarDays className="h-4 w-4" />
                View Appointments
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">Could not load sessions</p>
            <p className="mt-0.5 break-words text-red-700/90">{error}</p>
          </div>
        </div>
      ) : null}

      {/* Statistics */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-[#E2E8F0] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#64748B]">Upcoming Sessions</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-[#183B3A]">
                {loading ? "—" : upcomingConfirmedCount}
              </p>
              <p className="mt-1 text-xs text-[#64748B]">Confirmed sessions ahead</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F7F3] text-[#0D9488] ring-1 ring-[#BFE7DD]">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
        </Card>
        <Card className="border-[#E2E8F0] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#64748B]">Completed Sessions</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-[#183B3A]">
                {loading ? "—" : completedCount}
              </p>
              <p className="mt-1 text-xs text-[#64748B]">Finished counseling sessions</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </Card>
        <Card className="border-[#E2E8F0] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#64748B]">Pending Requests</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-[#183B3A]">
                {loading ? "—" : pendingCount}
              </p>
              <p className="mt-1 text-xs text-[#64748B]">Awaiting confirmation</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </section>

      {/* Upcoming Sessions */}
      <section className="flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-semibold text-[#183B3A]">Upcoming Sessions</h3>
          <p className="text-sm text-[#64748B]">Join when your counselor is ready.</p>
        </div>

        {loading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {[0, 1].map((i) => (
              <Card key={i} className="animate-pulse border-[#E2E8F0] bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-slate-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/2 rounded bg-slate-100" />
                    <div className="h-3 w-1/3 rounded bg-slate-100" />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-3 w-2/3 rounded bg-slate-100" />
                  <div className="h-3 w-1/2 rounded bg-slate-100" />
                </div>
                <div className="mt-5 flex gap-2">
                  <div className="h-10 flex-1 rounded-xl bg-slate-100" />
                  <div className="h-10 flex-1 rounded-xl bg-slate-100" />
                </div>
              </Card>
            ))}
          </div>
        ) : upcoming.length === 0 ? (
          <Card className="border-[#E2E8F0] bg-white p-6 shadow-sm sm:p-10">
            <div className="mx-auto flex max-w-md flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F7F3] text-[#0D9488] ring-1 ring-[#BFE7DD]">
                <CalendarDays className="h-7 w-7" />
              </div>
              <h4 className="mt-4 text-lg font-semibold text-[#183B3A]">No Upcoming Sessions</h4>
              <p className="mt-2 text-sm leading-relaxed text-[#64748B]">
                You don&apos;t have a confirmed call session right now. Book a time that works for you.
              </p>
              <Button asChild className="mt-5 w-full justify-center bg-primary-dark text-white hover:bg-primary-deep sm:w-auto">
                <Link to="/student/appointments/book">
                  <Calendar className="h-4 w-4 shrink-0" />
                  Book a Session
                </Link>
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {upcoming.map((session) => {
              const joinable = canJoinSession(session);
              return (
                <Card key={session.id} className="border-[#E2E8F0] bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <UserAvatar
                        user={{ fullName: session.counselor_name || "Counselor", avatarUrl: session.counselor_avatar_url ?? null }}
                        size="lg"
                        className="ring-2 ring-[#E8F7F3]"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-[#183B3A]">{session.counselor_name || "Counselor"}</p>
                        <p className="text-sm text-[#64748B]">{session.concern_category || "Counseling session"}</p>
                      </div>
                    </div>
                    <Badge tone={statusBadgeTone(session.status)} className="shrink-0 capitalize">
                      {statusLabel(session.status)}
                    </Badge>
                  </div>

                  <div className="mt-4 grid gap-2 rounded-2xl border border-[#E2E8F0] bg-[#F5FAF9] p-4 text-sm text-[#183B3A]">
                    <div className="flex items-center gap-2 text-[#64748B]">
                      <Calendar className="h-4 w-4 text-[#0D9488]" />
                      <span className="text-[#183B3A]">{formatDateTime(session.slot_start)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#64748B]">
                      <Clock className="h-4 w-4 text-[#0D9488]" />
                      <span className="text-[#183B3A]">60 minutes</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#64748B]">
                      {session.mode === "online" ? <Video className="h-4 w-4 text-[#0D9488]" /> : <UserRound className="h-4 w-4 text-[#0D9488]" />}
                      <span className="text-[#183B3A]">{sessionTypeLabel(session.mode)}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    {joinable ? (
                      <>
                        <Button className="min-h-11 w-full flex-1 justify-center bg-primary-dark text-white hover:bg-primary-deep sm:w-auto" onClick={() => startCall(session, true)}>
                          <Video className="h-4 w-4 shrink-0" />
                          Join Video
                        </Button>
                        <Button variant="secondary" className="min-h-11 w-full flex-1 justify-center border-[#BFE7DD] bg-white text-[#183B3A] hover:bg-[#F5FAF9] sm:w-auto" onClick={() => startCall(session, false)}>
                          <Phone className="h-4 w-4 shrink-0" />
                          Join Audio
                        </Button>
                      </>
                    ) : session.status === "confirmed" && session.mode === "online" ? (
                      <div className="flex-1 rounded-xl border border-[#E2E8F0] bg-[#F5FAF9] px-3 py-2 text-center text-sm text-[#64748B]">
                        Join available near your scheduled time
                      </div>
                    ) : session.status === "pending" ? (
                      <div className="flex-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-sm text-amber-700">
                        Waiting for counselor confirmation
                      </div>
                    ) : (
                      <div className="flex-1 rounded-xl border border-[#E2E8F0] bg-[#F5FAF9] px-3 py-2 text-center text-sm text-[#64748B]">
                        Session not available to join
                      </div>
                    )}
                    <Button asChild variant="ghost" className="w-full justify-center border border-[#E2E8F0] bg-white text-[#183B3A] hover:bg-[#F5FAF9] sm:w-auto">
                      <Link to={`/student/appointments/${session.id}`}>
                        View Details <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Session History */}
      <section className="flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-semibold text-[#183B3A]">Session History</h3>
          <p className="text-sm text-[#64748B]">Your past and completed sessions.</p>
        </div>

        {loading ? (
          <Card className="border-[#E2E8F0] bg-white p-5 shadow-sm">
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex animate-pulse items-center gap-3 rounded-xl border border-[#E2E8F0] p-3">
                  <div className="h-10 w-10 rounded-full bg-slate-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 rounded bg-slate-100" />
                    <div className="h-3 w-1/2 rounded bg-slate-100" />
                  </div>
                  <div className="h-7 w-20 rounded-full bg-slate-100" />
                </div>
              ))}
            </div>
          </Card>
        ) : history.length === 0 ? (
          <Card className="border-[#E2E8F0] bg-white p-6 shadow-sm sm:p-10">
            <div className="mx-auto flex max-w-md flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-[#64748B] ring-1 ring-[#E2E8F0]">
                <Clock className="h-7 w-7" />
              </div>
              <h4 className="mt-4 text-lg font-semibold text-[#183B3A]">No Session History</h4>
              <p className="mt-2 text-sm leading-relaxed text-[#64748B]">
                Your past and completed sessions will appear here after your appointments.
              </p>
            </div>
          </Card>
        ) : (
          <Card className="overflow-hidden border-[#E2E8F0] bg-white shadow-sm">
            <ul className="divide-y divide-[#E2E8F0]">
              {pagedHistory.map((session) => (
                <li key={session.id} className="flex flex-col gap-3 p-4 transition-colors hover:bg-[#F5FAF9] sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <UserAvatar
                      user={{ fullName: session.counselor_name || "Counselor", avatarUrl: session.counselor_avatar_url ?? null }}
                      size="md"
                      className="ring-1 ring-[#E2E8F0]"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[#183B3A]">{session.counselor_name || "Counselor"}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#64748B]">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-[#0D9488]" />
                          {new Date(session.slot_start).toLocaleDateString(undefined, { dateStyle: "medium" })}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-[#0D9488]" />
                          {new Date(session.slot_start).toLocaleTimeString(undefined, { timeStyle: "short" })}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          {session.mode === "online" ? <Video className="h-3.5 w-3.5 text-[#0D9488]" /> : <UserRound className="h-3.5 w-3.5 text-[#0D9488]" />}
                          {sessionTypeLabel(session.mode)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <Badge tone={statusBadgeTone(session.status)} className="capitalize">
                      {statusLabel(session.status)}
                    </Badge>
                    <Button asChild variant="ghost" size="sm" className="min-h-11 w-full justify-center border border-[#E2E8F0] bg-white text-[#183B3A] hover:bg-[#F5FAF9] sm:min-h-9 sm:w-auto">
                      <Link to={`/student/appointments/${session.id}`}>
                        View Details <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
            {totalHistoryPages > 1 ? (
              <div className="flex flex-col gap-3 border-t border-[#E2E8F0] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <p className="text-sm text-[#64748B]">
                  Page {Math.min(historyPage, totalHistoryPages)} of {totalHistoryPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="min-h-11 flex-1 justify-center border-[#E2E8F0] bg-white text-[#183B3A] hover:bg-[#F5FAF9] sm:min-h-9 sm:flex-none"
                    onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                    disabled={historyPage <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="min-h-11 flex-1 justify-center border-[#E2E8F0] bg-white text-[#183B3A] hover:bg-[#F5FAF9] sm:min-h-9 sm:flex-none"
                    onClick={() => setHistoryPage((p) => Math.min(totalHistoryPages, p + 1))}
                    disabled={historyPage >= totalHistoryPages}
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </Card>
        )}
      </section>

      {activeCall ? (
        <InPageCall
          call={activeCall}
          displayName={user?.fullName || "Mindwell User"}
          onClose={() => setActiveCall(null)}
          onError={(msg) => setError(msg)}
        />
      ) : null}
    </div>
  );
}
