import { useEffect, useMemo, useState } from "react";
import { Card, Badge, IconBadge } from "@/components/ui/Primitives";
import { listAppointments, type Appointment } from "@/api/appointments";
import { formatDateTime } from "@/components/ui/Helpers";
import UserAvatar from "@/components/profile/UserAvatar";
import { CalendarDays, Clock3, CheckCircle2 } from "lucide-react";

export default function CounselorSchedulePage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void listAppointments()
      .then((all) =>
        setAppointments(
          all
            .filter((a) => a.status === "confirmed" || a.status === "pending")
            .sort((a, b) => a.slot_start.localeCompare(b.slot_start)),
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => ({
    total: appointments.length,
    confirmed: appointments.filter((a) => a.status === "confirmed").length,
    pending: appointments.filter((a) => a.status === "pending").length,
  }), [appointments]);

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <Card className="p-4 sm:p-5"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="text-xs uppercase tracking-[0.14em] text-ink-300 sm:tracking-[0.22em]">Upcoming</p><p className="mt-2 text-3xl font-semibold">{counts.total}</p><p className="mt-1 text-xs text-ink-400">Scheduled items</p></div><IconBadge icon={CalendarDays} tone="navy" /></div></Card>
        <Card className="p-4 sm:p-5"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="text-xs uppercase tracking-[0.14em] text-ink-300 sm:tracking-[0.22em]">Confirmed</p><p className="mt-2 text-3xl font-semibold">{counts.confirmed}</p><p className="mt-1 text-xs text-ink-400">Ready sessions</p></div><IconBadge icon={CheckCircle2} tone="teal" /></div></Card>
        <Card className="p-4 sm:p-5"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="text-xs uppercase tracking-[0.14em] text-ink-300 sm:tracking-[0.22em]">Pending</p><p className="mt-2 text-3xl font-semibold">{counts.pending}</p><p className="mt-1 text-xs text-ink-400">Awaiting action</p></div><IconBadge icon={Clock3} tone="mint" /></div></Card>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-line/70 px-4 py-4 sm:px-6 sm:py-5">
          <h2 className="text-lg font-semibold">Schedule</h2>
          <p className="mt-1 text-sm text-ink-400">Your upcoming pending and confirmed counseling sessions, ordered by time.</p>
        </div>
        {loading ? (
          <p className="px-4 py-8 text-sm text-ink-400 sm:px-6">Loading schedule…</p>
        ) : appointments.length === 0 ? (
          <div className="mw-empty-state flex flex-col items-center gap-3 px-4 py-10 text-center sm:px-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mint-soft text-teal ring-1 ring-teal/20 sm:h-14 sm:w-14"><CalendarDays className="h-6 w-6" /></span>
            <div className="min-w-0">
              <p className="font-medium">No upcoming sessions</p>
              <p className="mt-1 text-sm text-ink-400">Confirmed and pending appointments will appear here.</p>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-line/70">
            {appointments.map((appointment) => (
              <li key={appointment.id} className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-surface-2/30 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex min-w-0 items-center gap-3">
                  <UserAvatar
                    user={{ fullName: appointment.student_name ?? `Student ${appointment.student_user_id}`, avatarUrl: appointment.student_avatar_url ?? null }}
                    size="md"
                  />
                  <div className="min-w-0">
                    <p className="break-words font-medium">{appointment.student_name ?? `Student #${appointment.student_user_id}`}</p>
                    <p className="text-sm text-ink-400">{formatDateTime(appointment.slot_start)} • {appointment.mode.replace("_", " ")}</p>
                    {appointment.concern_category ? <p className="mt-1 break-words text-xs text-ink-400">{appointment.concern_category}</p> : null}
                  </div>
                </div>
                <Badge tone={appointment.status === "confirmed" ? "success" : "warning"} className="w-fit shrink-0 capitalize">{appointment.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
