import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Card, Button, Badge } from "@/components/ui/Primitives";
import { Alert } from "@/components/ui/Feedback";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import {
  listAppointments,
  updateAppointmentStatus,
  type Appointment,
} from "@/api/appointments";
import { formatDateTime } from "@/components/ui/Helpers";
import { errorMessage } from "@/api/client";
import {
  Video,
  Calendar,
  Clock,
  Phone,
  Plus,
  CheckCircle2,
  ShieldCheck,
  CalendarDays,
  UserRound,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Eye,
  Loader2,
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
  if (mode === "online") return "Video / Audio";
  if (mode === "in_person") return "In person";
  return "Session";
}

function canJoinSession(appt: Appointment) {
  if (appt.status !== "confirmed") return false;
  if (appt.mode !== "online") return false;
  const start = new Date(appt.slot_start).getTime();
  const end = new Date(appt.slot_end).getTime();
  const now = Date.now();
  const openFrom = start - 10 * 60 * 1000;
  const openUntil = Math.max(end, start + 2 * 60 * 60 * 1000);
  return now >= openFrom && now <= openUntil;
}

const PAGE_SIZE = 6;

type Notice = { tone: "success" | "danger" | "info"; message: string } | null;

export default function CounselorCallSessionsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [activeCall, setActiveCall] = useState<InPageCallInfo | null>(null);
  const [startingCallId, setStartingCallId] = useState<number | null>(null);
  const [busyRequestId, setBusyRequestId] = useState<number | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [detailsAppt, setDetailsAppt] = useState<Appointment | null>(null);
  const [detailsSnapshot, setDetailsSnapshot] = useState<Appointment | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Appointment | null>(null);

  function openDetails(appt: Appointment) {
    setDetailsSnapshot(appt);
    setDetailsAppt(appt);
  }

  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await listAppointments();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      setLoadError(errorMessage(err, "Unable to load call sessions. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const now = Date.now();

  const upcomingConfirmed = useMemo(
    () =>
      appointments
        .filter((a) => a.status === "confirmed" && new Date(a.slot_end).getTime() >= now)
        .sort((a, b) => +new Date(a.slot_start) - +new Date(b.slot_start)),
    [appointments, now],
  );

  const pendingRequests = useMemo(
    () =>
      appointments
        .filter((a) => a.status === "pending")
        .sort((a, b) => +new Date(a.slot_start) - +new Date(b.slot_start)),
    [appointments],
  );

  const history = useMemo(
    () =>
      appointments
        .filter((a) => {
          if (a.status === "completed" || a.status === "cancelled" || a.status === "declined") return true;
          return new Date(a.slot_end).getTime() < now;
        })
        .sort((a, b) => +new Date(b.slot_start) - +new Date(a.slot_start)),
    [appointments, now],
  );

  const stats = useMemo(
    () => ({
      upcoming: appointments.filter((a) => a.status === "confirmed" && new Date(a.slot_end).getTime() >= now).length,
      completed: appointments.filter((a) => a.status === "completed").length,
      pending: appointments.filter((a) => a.status === "pending").length,
    }),
    [appointments, now],
  );

  const totalHistoryPages = Math.max(1, Math.ceil(history.length / PAGE_SIZE));
  const pagedHistory = useMemo(() => {
    const page = Math.min(historyPage, totalHistoryPages);
    const start = (page - 1) * PAGE_SIZE;
    return history.slice(start, start + PAGE_SIZE);
  }, [history, historyPage, totalHistoryPages]);

  useEffect(() => {
    setHistoryPage((p) => Math.min(Math.max(1, p), totalHistoryPages));
  }, [totalHistoryPages]);

  const nextSession = upcomingConfirmed[0];

  const startCall = (session: Appointment, video: boolean) => {
    setActionError(null);
    setNotice(null);
    if (activeCall) {
      setActionError("You already have an active call. End the current session before starting another.");
      return;
    }
    if (!canJoinSession(session)) {
      setActionError("This session cannot be started right now. You can join confirmed online sessions near the scheduled time.");
      return;
    }
    setStartingCallId(session.id);
    const room = `Mindwell-Appointment-${session.id}`;
    // brief loading state for feedback, InPageCall handles connection
    window.setTimeout(() => {
      setActiveCall({
        room,
        video,
        name: session.student_name || "Student session",
        details: {
          participantLabel: "Student",
          participantName: session.student_name || "Student",
          participantRole: "student",
          counterpartName: user?.fullName || "Counselor",
          counterpartRole: "counselor",
          scheduledAt: session.slot_start,
          durationLabel: "60 minutes",
          status: session.status,
          sessionType: session.mode === "online" ? (video ? "Online video session" : "Online audio session") : "In-person session",
        },
      });
      setStartingCallId(null);
    }, 250);
  };

  async function handleRequestAction(id: number, status: "confirmed" | "declined") {
    if (status === "declined") {
      const target = appointments.find((appt) => appt.id === id);
      if (target) setRejectTarget(target);
      return;
    }
    await applyRequestAction(id, status);
  }

  async function applyRequestAction(id: number, status: "confirmed" | "declined") {
    setBusyRequestId(id);
    setActionError(null);
    setNotice(null);
    const successMessage =
      status === "confirmed" ? "Appointment request approved successfully." : "Appointment request rejected.";
    try {
      await updateAppointmentStatus(id, status);
      setNotice({ tone: "success", message: successMessage });
      toast.success(status === "confirmed" ? "Request approved" : "Request rejected", successMessage);
      setRejectTarget(null);
      await load();
    } catch (err) {
      const message = errorMessage(err, "Could not update the appointment request.");
      setActionError(message);
      toast.error("Action failed", message);
    } finally {
      setBusyRequestId(null);
    }
  }

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
              COUNSELOR WORKSPACE
            </div>
            <h2 className="mt-4 text-2xl font-semibold leading-tight tracking-tight text-[#183B3A] sm:text-3xl lg:text-[2rem]">
              Manage Your Counseling Sessions
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#64748B] sm:text-base">
              Start and manage your counseling calls in one place. Open a session to connect with students securely and professionally.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-3 rounded-2xl border border-[#D7ECE6] bg-white/85 px-3 py-2 shadow-sm">
                <UserAvatar
                  user={{ fullName: user?.fullName || "Counselor", avatarUrl: user?.avatarUrl ?? null }}
                  size="md"
                  className="ring-1 ring-[#BFE7DD]"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#183B3A]">{user?.fullName || "Counselor"}</p>
                  <p className="text-xs text-[#0D9488]">Authenticated counselor</p>
                </div>
              </div>
              {nextSession ? (
                <div className="inline-flex w-full flex-col gap-1 rounded-2xl border border-[#D7ECE6] bg-white/80 px-4 py-3 text-sm text-[#183B3A] shadow-sm sm:w-auto sm:flex-row sm:items-center sm:gap-3">
                  <span className="font-medium text-[#0D9488]">Next session</span>
                  <span className="text-[#64748B]">{nextSession.student_name || "Student"}</span>
                  <span className="text-[#64748B]">{formatDateTime(nextSession.slot_start)}</span>
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button asChild className="w-full justify-center bg-primary-dark text-white hover:bg-primary-deep sm:w-auto">
              <Link to="/counselor/schedule">
                <Plus className="h-4 w-4" />
                Schedule Session
              </Link>
            </Button>
            <Button asChild variant="secondary" className="w-full justify-center border-[#BFE7DD] bg-white text-[#183B3A] hover:bg-[#F5FAF9] sm:w-auto">
              <Link to="/counselor/schedule">
                <CalendarDays className="h-4 w-4" />
                Appointments
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {notice ? (
        <Alert tone={notice.tone === "danger" ? "danger" : notice.tone === "info" ? "info" : "success"} className="border-[#BFE7DD]">
          <div className="flex items-center justify-between gap-3">
            <span>{notice.message}</span>
            <button type="button" onClick={() => setNotice(null)} className="rounded p-1 text-[#64748B] hover:bg-black/5 hover:text-[#183B3A]" aria-label="Dismiss notification">
              <X className="h-4 w-4" />
            </button>
          </div>
        </Alert>
      ) : null}
      {actionError ? (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="flex-1">{actionError}</div>
          <button type="button" onClick={() => setActionError(null)} className="rounded p-1 hover:bg-red-100" aria-label="Dismiss error">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}
      {loadError ? (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">Could not load sessions</p>
            <p className="mt-0.5">{loadError}</p>
          </div>
        </div>
      ) : null}

      {/* Statistics */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-[#E2E8F0] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#64748B]">Upcoming Sessions</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-[#183B3A]">{loading ? "—" : stats.upcoming}</p>
              <p className="mt-1 text-xs text-[#64748B]">Confirmed upcoming sessions</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F7F3] text-[#0D9488] ring-1 ring-[#BFE7DD]">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
        </Card>
        <Card className="border-[#E2E8F0] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#64748B]">Completed Sessions</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-[#183B3A]">{loading ? "—" : stats.completed}</p>
              <p className="mt-1 text-xs text-[#64748B]">Completed counseling sessions</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </Card>
        <Card className="border-[#E2E8F0] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#64748B]">Pending Requests</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-[#183B3A]">{loading ? "—" : stats.pending}</p>
              <p className="mt-1 text-xs text-[#64748B]">Pending appointment requests</p>
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
          <p className="text-sm text-[#64748B]">Start a video or audio call when you're ready.</p>
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
        ) : upcomingConfirmed.length === 0 ? (
          <Card className="border-[#E2E8F0] bg-white p-8 shadow-sm sm:p-10">
            <div className="mx-auto flex max-w-md flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F7F3] text-[#0D9488] ring-1 ring-[#BFE7DD]">
                <CalendarDays className="h-7 w-7" />
              </div>
              <h4 className="mt-4 text-lg font-semibold text-[#183B3A]">No Upcoming Sessions</h4>
              <p className="mt-2 text-sm leading-relaxed text-[#64748B]">
                You currently have no scheduled counseling sessions. New appointments assigned to you will appear here.
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {upcomingConfirmed.map((session) => {
              const joinable = canJoinSession(session);
              const starting = startingCallId === session.id;
              return (
                <Card key={session.id} className="border-[#E2E8F0] bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <UserAvatar
                        user={{ fullName: session.student_name || "Student", avatarUrl: session.student_avatar_url ?? null }}
                        size="lg"
                        className="ring-2 ring-[#E8F7F3]"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-[#183B3A]">{session.student_name || "Student"}</p>
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
                    <div className="flex items-center gap-2 text-[#64748B]">
                      <ShieldCheck className="h-4 w-4 text-[#0D9488]" />
                      <span className="text-[#183B3A]">{session.mode === "online" ? "Online session" : "In-person session"}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    {joinable ? (
                      <>
                        <Button
                          className="flex-1 bg-primary-dark text-white hover:bg-primary-deep"
                          onClick={() => startCall(session, true)}
                          disabled={!!activeCall || starting}
                        >
                          {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
                          {starting ? "Connecting..." : "Start Video"}
                        </Button>
                        <Button
                          variant="secondary"
                          className="flex-1 border-[#BFE7DD] bg-white text-[#183B3A] hover:bg-[#F5FAF9]"
                          onClick={() => startCall(session, false)}
                          disabled={!!activeCall || starting}
                        >
                          {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
                          {starting ? "Connecting..." : "Start Audio"}
                        </Button>
                      </>
                    ) : session.mode === "online" ? (
                      <div className="flex-1 rounded-xl border border-[#E2E8F0] bg-[#F5FAF9] px-3 py-2 text-center text-sm text-[#64748B]">
                        Start available for confirmed sessions near the scheduled time
                      </div>
                    ) : (
                      <div className="flex-1 rounded-xl border border-[#E2E8F0] bg-[#F5FAF9] px-3 py-2 text-center text-sm text-[#64748B]">
                        In-person session (video/audio call unavailable)
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      className="border border-[#E2E8F0] bg-white text-[#183B3A] hover:bg-[#F5FAF9]"
                      onClick={() => openDetails(session)}
                    >
                      <Eye className="h-4 w-4" /> View Details
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Pending Requests */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[#183B3A]">Pending Session Requests</h3>
            <p className="text-sm text-[#64748B]">Review and respond to student appointment requests.</p>
          </div>
          {pendingRequests.length > 0 ? (
            <Badge tone="warning" className="w-fit">{pendingRequests.length} pending</Badge>
          ) : null}
        </div>

        {loading ? (
          <Card className="border-[#E2E8F0] bg-white p-5 shadow-sm">
            <div className="space-y-3">
              {[0, 1].map((i) => (
                <div key={i} className="flex animate-pulse items-center gap-3 rounded-xl border border-[#E2E8F0] p-3">
                  <div className="h-10 w-10 rounded-full bg-slate-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 rounded bg-slate-100" />
                    <div className="h-3 w-1/2 rounded bg-slate-100" />
                  </div>
                  <div className="h-8 w-24 rounded-lg bg-slate-100" />
                </div>
              ))}
            </div>
          </Card>
        ) : pendingRequests.length === 0 ? (
          <Card className="border-[#E2E8F0] bg-white p-8 shadow-sm sm:p-10">
            <div className="mx-auto flex max-w-md flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
                <Clock className="h-7 w-7" />
              </div>
              <h4 className="mt-4 text-lg font-semibold text-[#183B3A]">No Pending Requests</h4>
              <p className="mt-2 text-sm leading-relaxed text-[#64748B]">
                You're all caught up. New student appointment requests will appear here.
              </p>
            </div>
          </Card>
        ) : (
          <Card className="overflow-hidden border-[#E2E8F0] bg-white shadow-sm">
            <ul className="divide-y divide-[#E2E8F0]">
              {pendingRequests.map((req) => {
                const busy = busyRequestId === req.id;
                return (
                  <li key={req.id} className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <UserAvatar
                        user={{ fullName: req.student_name || "Student", avatarUrl: req.student_avatar_url ?? null }}
                        size="md"
                        className="ring-1 ring-[#E2E8F0]"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#183B3A]">{req.student_name || `Student #${req.student_user_id}`}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#64748B]">
                          <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-[#0D9488]" />{formatDateTime(req.slot_start)}</span>
                          <span className="inline-flex items-center gap-1.5">{req.mode === "online" ? <Video className="h-3.5 w-3.5 text-[#0D9488]" /> : <UserRound className="h-3.5 w-3.5 text-[#0D9488]" />}{sessionTypeLabel(req.mode)}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge tone="warning" className="capitalize">Pending</Badge>
                          {req.concern_category ? <Badge tone="neutral">{req.concern_category}</Badge> : null}
                        </div>
                        {req.student_note ? (
                          <p className="mt-2 text-sm text-[#64748B]"><span className="font-medium text-[#183B3A]">Reason/Note:</span> {req.student_note}</p>
                        ) : (
                          <p className="mt-2 text-xs text-[#64748B]">No reason provided by student.</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      <Button
                        size="sm"
                        className="bg-primary-dark text-white hover:bg-primary-deep"
                        onClick={() => void handleRequestAction(req.id, "confirmed")}
                        disabled={busy}
                      >
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        Approve Request
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="border-red-200 bg-white text-red-700 hover:bg-red-50"
                        onClick={() => void handleRequestAction(req.id, "declined")}
                        disabled={busy}
                      >
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                        Reject Request
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="border border-[#E2E8F0] bg-white text-[#183B3A] hover:bg-[#F5FAF9]"
                        onClick={() => openDetails(req)}
                      >
                        <Eye className="h-4 w-4" /> View Details
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </section>

      {/* Session History */}
      <section className="flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-semibold text-[#183B3A]">Session History</h3>
          <p className="text-sm text-[#64748B]">Your previous and completed counseling sessions.</p>
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
          <Card className="border-[#E2E8F0] bg-white p-8 shadow-sm sm:p-10">
            <div className="mx-auto flex max-w-md flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-[#64748B] ring-1 ring-[#E2E8F0]">
                <Clock className="h-7 w-7" />
              </div>
              <h4 className="mt-4 text-lg font-semibold text-[#183B3A]">No Session History</h4>
              <p className="mt-2 text-sm leading-relaxed text-[#64748B]">
                Your completed counseling sessions will appear here.
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
                      user={{ fullName: session.student_name || "Student", avatarUrl: session.student_avatar_url ?? null }}
                      size="md"
                      className="ring-1 ring-[#E2E8F0]"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[#183B3A]">{session.student_name || "Student"}</p>
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
                    <Button
                      variant="ghost"
                      size="sm"
                      className="border border-[#E2E8F0] bg-white text-[#183B3A] hover:bg-[#F5FAF9]"
                      onClick={() => openDetails(session)}
                    >
                      <Eye className="h-4 w-4" /> View Details
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
            {totalHistoryPages > 1 ? (
              <div className="flex items-center justify-between gap-3 border-t border-[#E2E8F0] px-4 py-3 sm:px-5">
                <p className="text-sm text-[#64748B]">
                  Page {Math.min(historyPage, totalHistoryPages)} of {totalHistoryPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="border-[#E2E8F0] bg-white text-[#183B3A] hover:bg-[#F5FAF9]"
                    onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                    disabled={historyPage <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="border-[#E2E8F0] bg-white text-[#183B3A] hover:bg-[#F5FAF9]"
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

      {/* Session Details Modal */}
      <Modal
        open={Boolean(detailsAppt)}
        onClose={() => setDetailsAppt(null)}
        title="Session Details"
        description="Appointment and participant information"
        size="lg"
        footer={
          <Button variant="secondary" onClick={() => setDetailsAppt(null)}>
            Close
          </Button>
        }
      >
        {detailsSnapshot ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <UserAvatar
                  user={{
                    fullName: detailsSnapshot.student_name || "Student",
                    avatarUrl: detailsSnapshot.student_avatar_url ?? null,
                  }}
                  size="lg"
                  className="ring-1 ring-border"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-body">Student</p>
                  <p className="truncate text-base font-semibold text-heading">
                    {detailsSnapshot.student_name || `Student #${detailsSnapshot.student_user_id}`}
                  </p>
                  <p className="text-sm text-body">Student ID: {detailsSnapshot.student_user_id}</p>
                </div>
              </div>
              <Badge tone={statusBadgeTone(detailsSnapshot.status)} className="w-fit capitalize">
                {statusLabel(detailsSnapshot.status)}
              </Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-canvas p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-body">Date & time</p>
                <p className="mt-2 text-sm font-medium text-heading">{formatDateTime(detailsSnapshot.slot_start)}</p>
                <p className="mt-1 text-sm text-body">Ends: {formatDateTime(detailsSnapshot.slot_end)}</p>
              </div>
              <div className="rounded-2xl border border-border bg-canvas p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-body">Session type</p>
                <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-heading">
                  {detailsSnapshot.mode === "online" ? (
                    <Video className="h-4 w-4 text-primary" />
                  ) : (
                    <UserRound className="h-4 w-4 text-primary" />
                  )}
                  {sessionTypeLabel(detailsSnapshot.mode)}
                </p>
                <p className="mt-1 text-sm text-body">
                  {detailsSnapshot.mode === "online" ? "Online call session" : "In-person appointment"}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-body">Concern / reason</p>
              <p className="mt-2 text-sm text-heading">{detailsSnapshot.concern_category || "Not specified"}</p>
            </div>

            <div className="rounded-2xl border border-border bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-body">Student note</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-body">
                {detailsSnapshot.student_note?.trim() ? detailsSnapshot.student_note : "No note provided by student."}
              </p>
            </div>

            {detailsSnapshot.counselor_note ? (
              <div className="rounded-2xl border border-border bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-body">Counselor note</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-body">{detailsSnapshot.counselor_note}</p>
              </div>
            ) : null}

            {detailsSnapshot.cancellation_reason ? (
              <div className="rounded-2xl border border-danger/20 bg-danger-soft p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-danger-ink">Cancellation reason</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-danger-ink">
                  {detailsSnapshot.cancellation_reason}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        title="Reject appointment request?"
        description="This action cannot be undone from this screen."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={busyRequestId === rejectTarget?.id}
              onClick={() => rejectTarget && void applyRequestAction(rejectTarget.id, "declined")}
            >
              Reject request
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3 rounded-2xl border border-warning/25 bg-warning-soft p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning-ink" />
          <div className="text-sm leading-relaxed text-heading">
            <p>
              You are about to reject the request from{" "}
              <span className="font-semibold">{rejectTarget?.student_name || "this student"}</span>.
            </p>
            <p className="mt-1 text-body">The student will be notified that their request was not accepted.</p>
          </div>
        </div>
      </Modal>

      {activeCall ? (
        <InPageCall
          call={activeCall}
          displayName={user?.fullName || "Mindwell User"}
          onClose={() => setActiveCall(null)}
          onError={(msg) => {
            setActionError(msg);
            setActiveCall(null);
          }}
        />
      ) : null}
    </div>
  );
}
