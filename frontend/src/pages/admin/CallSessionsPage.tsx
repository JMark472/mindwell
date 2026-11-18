import { useEffect, useMemo, useState } from "react";
import { Card, Badge, IconBadge } from "@/components/ui/Primitives";
import { EmptyState } from "@/components/ui/Feedback";
import { listAppointments, type Appointment } from "@/api/appointments";
import { formatDateTime } from "@/components/ui/Helpers";
import UserAvatar from "@/components/profile/UserAvatar";
import { Video, Calendar, Clock, Activity, Users, Sparkles, ShieldCheck, Wifi } from "lucide-react";

export default function AdminCallSessionsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listAppointments()
      .then(setAppointments)
      .finally(() => setLoading(false));
  }, []);

  const sessions = useMemo(
    () =>
      appointments
        .filter((a) => a.mode === "online" || a.mode === "in_person")
        .sort((a, b) => +new Date(b.slot_start) - +new Date(a.slot_start)),
    [appointments],
  );

  const confirmed = useMemo(() => sessions.filter((a) => a.status === "confirmed"), [sessions]);
  const completed = useMemo(() => sessions.filter((a) => a.status === "completed"), [sessions]);
  const today = useMemo(
    () => sessions.filter((a) => new Date(a.slot_start).toDateString() === new Date().toDateString()),
    [sessions],
  );

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
          <ShieldCheck className="h-8 w-8" />
          <Wifi className="h-8 w-8" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-pill bg-white/10 px-3 py-1 text-xs font-medium text-white/90 ring-1 ring-white/15 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            System overview
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Call Session Monitoring</h2>
          <p className="mt-2 text-sm text-white/75 sm:text-base">
            Monitor scheduled audio and video counseling sessions across the platform, including today’s activity and session status.
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-ink-300">Total</p>
              <p className="mt-2 text-3xl font-semibold">{sessions.length}</p>
              <p className="mt-1 text-xs text-ink-400">All sessions</p>
            </div>
            <IconBadge icon={Video} tone="teal" />
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-ink-300">Today</p>
              <p className="mt-2 text-3xl font-semibold">{today.length}</p>
              <p className="mt-1 text-xs text-ink-400">Scheduled today</p>
            </div>
            <IconBadge icon={Clock} tone="sky" />
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-ink-300">Confirmed</p>
              <p className="mt-2 text-3xl font-semibold">{confirmed.length}</p>
              <p className="mt-1 text-xs text-ink-400">Ready sessions</p>
            </div>
            <IconBadge icon={Calendar} tone="mint" />
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-ink-300">Completed</p>
              <p className="mt-2 text-3xl font-semibold">{completed.length}</p>
              <p className="mt-1 text-xs text-ink-400">Finished</p>
            </div>
            <IconBadge icon={Activity} tone="navy" />
          </div>
        </Card>
      </div>

      <Card hover={false} className="overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-line/70 px-6 py-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold">All sessions</h3>
            <p className="mt-1 text-sm text-ink-400">System-wide audio and video session activity</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-pill bg-surface-2 px-3 py-1.5 text-xs font-medium text-ink-600 ring-1 ring-line/60">
            <Users className="h-3.5 w-3.5 text-teal" />
            {sessions.length} total
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 p-6">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-navy-050" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-4 sm:p-6">
            <EmptyState
              title="No sessions found"
              description="No audio or video sessions have been scheduled yet."
            />
          </div>
        ) : (
          <ul className="divide-y divide-line/70">
            {sessions.slice(0, 30).map((session) => (
              <li key={session.id} className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-surface-2/50 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex shrink-0 items-center -space-x-2">
                    <UserAvatar
                      user={{ fullName: session.student_name || "Student", avatarUrl: session.student_avatar_url ?? null }}
                      size="md"
                      className="ring-2 ring-white"
                    />
                    <UserAvatar
                      user={{ fullName: session.counselor_name || "Counselor", avatarUrl: session.counselor_avatar_url ?? null }}
                      size="sm"
                      className="ring-2 ring-white"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {session.student_name || "Student"} <span className="text-ink-300">↔</span> {session.counselor_name || "Counselor"}
                    </p>
                    <p className="truncate text-sm text-ink-400">
                      {formatDateTime(session.slot_start)} · {session.mode === "online" ? "Online" : "In person"} · 60 min
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={session.mode === "online" ? "info" : "neutral"} className="capitalize">
                    {session.mode === "online" ? "Online" : "In person"}
                  </Badge>
                  <Badge
                    tone={session.status === "completed" ? "success" : session.status === "confirmed" ? "teal" : session.status === "cancelled" ? "danger" : "neutral"}
                    className="capitalize"
                  >
                    {session.status}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
