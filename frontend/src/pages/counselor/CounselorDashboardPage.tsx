import { useEffect, useState } from "react";
import { Card, Button, IconBadge, Badge } from "@/components/ui/Primitives";
import { listAppointments, type Appointment } from "@/api/appointments";
import { getCaseload, type CaseloadEntry } from "@/api/counseling";
import { formatDateTime } from "@/components/ui/Helpers";
import { Link } from "react-router";
import { CalendarClock, Inbox, MessageSquare, Users, ArrowRight, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import UserAvatar from "@/components/profile/UserAvatar";
import DashboardHero from "@/components/ui/DashboardHero";
import AnimatedCounter from "@/components/ui/AnimatedCounter";

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
      <DashboardHero
        eyebrow="Counselor command center"
        greeting={`${getGreeting()}, ${firstName}`}
        title="Stay on top of your sessions"
        description="Review requests, track your caseload, and respond to students in one calm workspace."
        avatar={{ name: user?.fullName ?? "Counselor", url: user?.avatarUrl ?? null }}
        icon={Users}
        actions={
          <>
            <Button asChild className="w-full justify-center sm:w-auto">
              <Link to="/counselor/requests">
                Review requests
                <ArrowRight aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary" className="w-full justify-center sm:w-auto">
              <Link to="/counselor/schedule">
                View schedule
                <CalendarClock aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-center sm:w-auto">
              <Link to="/counselor/messages">
                Open messages
                <MessageSquare aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="relative overflow-hidden p-5 sm:p-6">
          <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-danger/10 blur-3xl" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-ink-300">Pending requests</p>
              <p className="mt-2 text-3xl font-semibold"><AnimatedCounter value={pending.length} /></p>
              <p className="mt-1 text-sm text-ink-400">Awaiting your response</p>
            </div>
            <IconBadge icon={Inbox} tone="danger" />
          </div>
        </Card>
        <Card className="relative overflow-hidden p-5 sm:p-6">
          <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-info/10 blur-3xl" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-ink-300">Total appointments</p>
              <p className="mt-2 text-3xl font-semibold"><AnimatedCounter value={appointments.length} /></p>
              <p className="mt-1 text-sm text-ink-400">Across all statuses</p>
            </div>
            <IconBadge icon={CalendarClock} tone="sky" />
          </div>
        </Card>
        <Card className="relative overflow-hidden p-5 sm:p-6">
          <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-mint/10 blur-3xl" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-ink-300">Active caseload</p>
              <p className="mt-2 text-3xl font-semibold"><AnimatedCounter value={caseload.length} /></p>
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
