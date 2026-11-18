import { useEffect, useState } from "react";
import { Card, Button, IconBadge, Badge } from "@/components/ui/Primitives";
import { listAppointments, type Appointment } from "@/api/appointments";
import { getCaseload, type CaseloadEntry } from "@/api/counseling";
import { formatDateTime } from "@/components/ui/Helpers";
import { Link } from "react-router";
import { CalendarClock, Inbox, MessageSquare, PhoneCall, Users, ArrowRight, Sparkles, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import UserAvatar from "@/components/profile/UserAvatar";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function CounselorDashboardPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [caseload, setCaseload] = useState<CaseloadEntry[]>([]);

  useEffect(() => {
    void listAppointments().then(setAppointments);
    void getCaseload().then(setCaseload);
  }, []);

  const pending = appointments.filter((a) => a.status === "pending");
  const upcoming = appointments
    .filter((a) => a.status === "confirmed")
    .sort((a, b) => new Date(a.slot_start).getTime() - new Date(b.slot_start).getTime())
    .slice(0, 4);
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
          <Users className="h-5 w-5 sm:h-7 sm:w-7" />
          <MessageSquare className="h-5 w-5 sm:h-7 sm:w-7" />
          <PhoneCall className="h-5 w-5 sm:h-7 sm:w-7" />
        </div>
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <Badge tone="teal" className="w-fit max-w-full border border-white/20 bg-white/10 px-3 py-1 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
              <Sparkles aria-hidden="true" className="mr-1 h-3 w-3 shrink-0" />
              Counselor command center
            </Badge>
            <div className="flex items-center gap-3 sm:gap-4">
              <UserAvatar
                user={{ fullName: user?.fullName ?? "Counselor", avatarUrl: user?.avatarUrl ?? null }}
                size="lg"
                className="h-12 w-12 shrink-0 ring-2 ring-white/40 shadow-[0_20px_60px_-30px_rgba(255,255,255,0.8)] sm:h-14 sm:w-14"
              />
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/70 sm:text-sm sm:normal-case sm:tracking-normal">{getGreeting()}, {firstName}</p>
                <h2 className="mt-1 text-xl font-semibold leading-tight tracking-tight text-white sm:text-2xl lg:text-3xl">
                  Stay on top of your sessions
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base">
                  Review requests, track your caseload, and respond to students in one calm workspace.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap sm:items-center">
              <Button asChild variant="glass" className="w-full justify-center border-white/40 bg-white/95 text-navy hover:bg-white sm:w-auto">
                <Link to="/counselor/requests">
                  Review requests
                  <ArrowRight aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-center text-white hover:bg-white/10 sm:w-auto">
                <Link to="/counselor/schedule">
                  View schedule
                  <CalendarClock aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-center text-white hover:bg-white/10 sm:w-auto">
                <Link to="/counselor/messages">
                  Open messages
                  <MessageSquare aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
          <div className="mw-float relative hidden h-40 w-40 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-xl lg:flex xl:h-44 xl:w-44">
            <div className="absolute inset-6 rounded-full bg-gradient-to-br from-sky/40 to-white/10" />
            <Users aria-hidden="true" className="relative h-11 w-11 text-white xl:h-12 xl:w-12" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="relative overflow-hidden p-6">
          <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-danger/10 blur-3xl" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-ink-300">Pending requests</p>
              <p className="mt-2 text-3xl font-semibold">{pending.length}</p>
              <p className="mt-1 text-sm text-ink-400">Awaiting your response</p>
            </div>
            <IconBadge icon={Inbox} tone="danger" />
          </div>
        </Card>
        <Card className="relative overflow-hidden p-6">
          <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-info/10 blur-3xl" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-ink-300">Total appointments</p>
              <p className="mt-2 text-3xl font-semibold">{appointments.length}</p>
              <p className="mt-1 text-sm text-ink-400">Across all statuses</p>
            </div>
            <IconBadge icon={CalendarClock} tone="sky" />
          </div>
        </Card>
        <Card className="relative overflow-hidden p-6">
          <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-mint/10 blur-3xl" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-ink-300">Active caseload</p>
              <p className="mt-2 text-3xl font-semibold">{caseload.length}</p>
              <p className="mt-1 text-sm text-ink-400">Students under care</p>
            </div>
            <IconBadge icon={Users} tone="teal" />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/70 px-6 py-5">
            <div>
              <h2 className="text-lg font-semibold">Appointment requests</h2>
              <p className="mt-1 text-sm text-ink-400">Review and take action on new requests.</p>
            </div>
            <Button asChild variant="secondary">
              <Link to="/counselor/requests">
                View all
                <ArrowRight aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          {pending.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm font-semibold">All caught up</p>
              <p className="mt-1 text-sm text-ink-400">No pending appointment requests right now.</p>
            </div>
          ) : (
            <ul className="divide-y divide-line/70">
              {pending.slice(0, 4).map((appointment) => (
                <li key={appointment.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      user={{
                        fullName: appointment.student_name ?? `Student ${appointment.student_user_id}`,
                        avatarUrl: appointment.student_avatar_url ?? null,
                      }}
                      size="md"
                    />
                    <div>
                      <p className="font-medium">{appointment.student_name ?? `Student #${appointment.student_user_id}`}</p>
                      <p className="flex items-center gap-1.5 text-sm text-ink-400">
                        <Clock aria-hidden="true" className="h-3.5 w-3.5" />
                        {formatDateTime(appointment.slot_start)}
                      </p>
                    </div>
                  </div>
                  <Button asChild size="sm">
                    <Link to="/counselor/requests">Review request</Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-line/70 px-6 py-5">
            <div>
              <h2 className="text-lg font-semibold">Upcoming sessions</h2>
              <p className="mt-1 text-sm text-ink-400">Your confirmed appointments ahead.</p>
            </div>
            <Button asChild variant="ghost">
              <Link to="/counselor/schedule">Schedule</Link>
            </Button>
          </div>
          {upcoming.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm font-semibold">No upcoming sessions</p>
              <p className="mt-1 text-sm text-ink-400">Confirmed appointments will appear here.</p>
            </div>
          ) : (
            <ul className="divide-y divide-line/70">
              {upcoming.map((appointment) => (
                <li key={appointment.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      user={{
                        fullName: appointment.student_name ?? `Student ${appointment.student_user_id}`,
                        avatarUrl: appointment.student_avatar_url ?? null,
                      }}
                      size="md"
                    />
                    <div>
                      <p className="font-medium">{appointment.student_name ?? `Student #${appointment.student_user_id}`}</p>
                      <p className="text-sm text-ink-400">{formatDateTime(appointment.slot_start)}</p>
                    </div>
                  </div>
                  <Badge tone="teal">{appointment.mode.replace("_", " ")}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/70 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold">My caseload</h2>
            <p className="mt-1 text-sm text-ink-400">Quick access to your active students.</p>
          </div>
          <Button asChild variant="secondary">
            <Link to="/counselor/cases">
              View all cases
              <ArrowRight aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        {caseload.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm font-semibold">No students yet</p>
            <p className="mt-1 text-sm text-ink-400">Accepted appointments will build your caseload.</p>
          </div>
        ) : (
          <ul className="divide-y divide-line/70">
            {caseload.slice(0, 6).map((entry) => (
              <li key={entry.student_user_id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <UserAvatar
                    user={{ fullName: entry.name, avatarUrl: entry.avatar_url ?? null }}
                    size="md"
                  />
                  <div>
                    <p className="font-medium">{entry.name}</p>
                    <p className="text-sm text-ink-400">{entry.total_sessions} sessions completed</p>
                  </div>
                </div>
                <Button asChild size="sm" variant="ghost">
                  <Link to={`/counselor/cases?student=${entry.student_user_id}`}>Open case</Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
