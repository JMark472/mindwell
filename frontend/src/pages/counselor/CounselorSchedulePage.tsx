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
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.22em] text-ink-300">Upcoming</p><p className="mt-2 text-3xl font-semibold">{counts.total}</p><p className="mt-1 text-xs text-ink-400">Scheduled items</p></div><IconBadge icon={CalendarDays} tone="navy" /></div></Card>
        <Card className="p-5"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.22em] text-ink-300">Confirmed</p><p className="mt-2 text-3xl font-semibold">{counts.confirmed}</p><p className="mt-1 text-xs text-ink-400">Ready sessions</p></div><IconBadge icon={CheckCircle2} tone="teal" /></div></Card>
        <Card className="p-5"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.22em] text-ink-300">Pending</p><p className="mt-2 text-3xl font-semibold">{counts.pending}</p><p className="mt-1 text-xs text-ink-400">Awaiting action</p></div><IconBadge icon={Clock3} tone="mint" /></div></Card>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-line/70 px-6 py-5">
          <h2 className="text-lg font-semibold">Schedule</h2>
          <p className="mt-1 text-sm text-ink-400">Your upcoming pending and confirmed counseling sessions, ordered by time.</p>
        </div>
        {loading ? (
          <p className="px-6 py-8 text-sm text-ink-400">Loading schedule…</p>
        ) : appointments.length === 0 ? (
          <p className="px-6 py-8 text-sm text-ink-400">No upcoming sessions. Confirmed and pending appointments will appear here.</p>
        ) : (
          <ul className="divide-y divide-line/70">
            {appointments.map((appointment) => (
              <li key={appointment.id} className="flex flex-col gap-3 px-6 py-4 transition-colors hover:bg-surface-2/30 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <UserAvatar
                    user={{ fullName: appointment.student_name ?? `Student ${appointment.student_user_id}`, avatarUrl: appointment.student_avatar_url ?? null }}
                    size="md"
                  />
                  <div>
                    <p className="font-medium">{appointment.student_name ?? `Student #${appointment.student_user_id}`}</p>
                    <p className="text-sm text-ink-400">{formatDateTime(appointment.slot_start)} • {appointment.mode.replace("_", " ")}</p>
                    {appointment.concern_category ? <p className="mt-1 text-xs text-ink-400">{appointment.concern_category}</p> : null}
                  </div>
                </div>
                <Badge tone={appointment.status === "confirmed" ? "success" : "warning"} className="capitalize w-fit">{appointment.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
