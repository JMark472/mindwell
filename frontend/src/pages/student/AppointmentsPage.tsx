import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Card, Button, Badge, IconBadge } from "@/components/ui/Primitives";
import { EmptyState } from "@/components/ui/Feedback";
import { listAppointments, type Appointment } from "@/api/appointments";
import { formatDateTime } from "@/components/ui/Helpers";
import UserAvatar from "@/components/profile/UserAvatar";
import { CalendarClock, CheckCircle2, Clock3, XCircle, CalendarPlus } from "lucide-react";

const statusTone = (status: string) => {
  if (status === "confirmed") return "success";
  if (status === "completed") return "info";
  if (status === "pending") return "warning";
  if (status === "cancelled" || status === "declined") return "danger";
  return "neutral";
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listAppointments()
      .then(setAppointments)
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => ({
    total: appointments.length,
    upcoming: appointments.filter((a) => ["pending", "confirmed"].includes(a.status)).length,
    completed: appointments.filter((a) => a.status === "completed").length,
    cancelled: appointments.filter((a) => ["cancelled", "declined"].includes(a.status)).length,
  }), [appointments]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">My appointments</h2>
          <p className="text-sm text-ink-400">Track upcoming and past counseling sessions, including status and session details.</p>
        </div>
        <Button asChild className="w-full justify-center sm:w-auto">
          <Link to="/student/appointments/book"><CalendarPlus className="h-4 w-4 shrink-0" /> Book new appointment</Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4 sm:p-5"><div className="flex items-center justify-between gap-2"><div className="min-w-0"><p className="text-[10px] uppercase tracking-[0.12em] text-ink-300 sm:text-xs sm:tracking-[0.22em]">Total</p><p className="mt-2 text-2xl font-semibold sm:text-3xl">{counts.total}</p><p className="mt-1 text-xs text-ink-400">All appointments</p></div><IconBadge icon={CalendarClock} tone="navy" /></div></Card>
        <Card className="p-4 sm:p-5"><div className="flex items-center justify-between gap-2"><div className="min-w-0"><p className="text-[10px] uppercase tracking-[0.12em] text-ink-300 sm:text-xs sm:tracking-[0.22em]">Upcoming</p><p className="mt-2 text-2xl font-semibold sm:text-3xl">{counts.upcoming}</p><p className="mt-1 text-xs text-ink-400">Pending or confirmed</p></div><IconBadge icon={Clock3} tone="teal" /></div></Card>
        <Card className="p-4 sm:p-5"><div className="flex items-center justify-between gap-2"><div className="min-w-0"><p className="text-[10px] uppercase tracking-[0.12em] text-ink-300 sm:text-xs sm:tracking-[0.22em]">Completed</p><p className="mt-2 text-2xl font-semibold sm:text-3xl">{counts.completed}</p><p className="mt-1 text-xs text-ink-400">Finished sessions</p></div><IconBadge icon={CheckCircle2} tone="mint" /></div></Card>
        <Card className="p-4 sm:p-5"><div className="flex items-center justify-between gap-2"><div className="min-w-0"><p className="text-[10px] uppercase tracking-[0.12em] text-ink-300 sm:text-xs sm:tracking-[0.22em]">Cancelled</p><p className="mt-2 text-2xl font-semibold sm:text-3xl">{counts.cancelled}</p><p className="mt-1 text-xs text-ink-400">Cancelled or declined</p></div><IconBadge icon={XCircle} tone="sky" /></div></Card>
      </div>

      {loading ? (
        <Card className="p-5 sm:p-6"><p className="text-sm text-ink-400">Loading appointments…</p></Card>
      ) : appointments.length === 0 ? (
        <EmptyState
          title="No appointments yet"
          description="Book a session with a counselor to get started. You can choose a time, mode, and concern category."
          action={<Button asChild><Link to="/student/appointments/book">Find a counselor</Link></Button>}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="border-b border-line/70 px-4 py-4 sm:px-6">
            <h3 className="font-semibold">Appointment history</h3>
            <p className="mt-1 text-sm text-ink-400">Open any appointment to view details, notes, and available actions.</p>
          </div>
          <ul className="divide-y divide-line/70">
            {appointments.map((appointment) => (
              <li key={appointment.id} className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-surface-2/30 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex min-w-0 items-start gap-3">
                  <UserAvatar
                    user={{ fullName: appointment.counselor_name ?? "Counselor", avatarUrl: appointment.counselor_avatar_url ?? null }}
                    size="md"
                  />
                  <div className="min-w-0">
                    <p className="break-words font-medium">{appointment.counselor_name ?? "Counselor"}</p>
                    <p className="text-sm text-ink-400">
                      {formatDateTime(appointment.slot_start)} • {appointment.mode.replace("_", " ")}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {appointment.concern_category ? <Badge tone="neutral">{appointment.concern_category}</Badge> : null}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <Badge tone={statusTone(appointment.status) as any} className="capitalize">{appointment.status}</Badge>
                  <Button asChild variant="ghost" size="sm" className="min-h-11 w-full justify-center sm:min-h-9 sm:w-auto">
                    <Link to={`/student/appointments/${appointment.id}`}>View details</Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
