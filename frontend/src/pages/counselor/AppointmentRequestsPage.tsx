import { useEffect, useState } from "react";
import { Card, Button, Badge, IconBadge } from "@/components/ui/Primitives";
import { listAppointments, updateAppointmentStatus, type Appointment } from "@/api/appointments";
import { formatDateTime } from "@/components/ui/Helpers";
import { errorMessage } from "@/api/client";
import UserAvatar from "@/components/profile/UserAvatar";
import { CalendarClock, Check, X, Inbox } from "lucide-react";

export default function AppointmentRequestsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const all = await listAppointments();
      setAppointments(all.filter((a) => a.status === "pending"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function act(id: number, status: "confirmed" | "declined") {
    setError(null);
    try {
      await updateAppointmentStatus(id, status);
      await load();
    } catch (err) {
      setError(errorMessage(err, "Could not update the appointment."));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <IconBadge icon={CalendarClock} tone="teal" />
            <div>
              <h2 className="text-lg font-semibold">Appointment requests</h2>
              <p className="mt-1 text-sm text-ink-400">Review pending student requests, check details/notes, and accept or decline.</p>
            </div>
          </div>
          <Badge tone={appointments.length > 0 ? "warning" : "success"}>{appointments.length} pending</Badge>
        </div>
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-line/70 px-6 py-4">
          <h3 className="font-semibold">Pending requests</h3>
          <p className="mt-1 text-sm text-ink-400">Students are notified when you confirm or decline a request.</p>
        </div>
        {loading ? (
          <p className="px-6 py-8 text-sm text-ink-400">Loading requests…</p>
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-mint-soft text-teal ring-1 ring-teal/20"><Inbox className="h-6 w-6" /></span>
            <div>
              <p className="font-medium">No pending requests</p>
              <p className="mt-1 text-sm text-ink-400">New appointment requests from students will appear here.</p>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-line/70">
            {appointments.map((appointment) => (
              <li key={appointment.id} className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <UserAvatar
                    user={{ fullName: appointment.student_name ?? `Student ${appointment.student_user_id}`, avatarUrl: appointment.student_avatar_url ?? null }}
                    size="md"
                  />
                  <div>
                    <p className="font-medium">{appointment.student_name ?? `Student #${appointment.student_user_id}`}</p>
                    <p className="text-sm text-ink-400">{formatDateTime(appointment.slot_start)} • {appointment.mode.replace("_", " ")}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {appointment.concern_category ? <Badge tone="neutral">{appointment.concern_category}</Badge> : null}
                      <Badge tone="warning">Pending</Badge>
                    </div>
                    {appointment.student_note ? <p className="mt-2 text-sm text-ink-500"><span className="font-medium text-ink">Note:</span> {appointment.student_note}</p> : <p className="mt-2 text-xs text-ink-300">No note provided by student.</p>}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2 sm:pt-1">
                  <Button size="sm" onClick={() => void act(appointment.id, "confirmed")}>
                    <Check className="h-4 w-4" /> Accept
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => void act(appointment.id, "declined")}>
                    <X className="h-4 w-4" /> Decline
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
