import { useEffect, useState } from "react";
import { Card, Button } from "@/components/ui/Primitives";
import { listAppointments, updateAppointmentStatus, type Appointment } from "@/api/appointments";
import { formatDateTime } from "@/components/ui/Helpers";
import { errorMessage } from "@/api/client";

export default function AppointmentRequestsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const all = await listAppointments();
    setAppointments(all.filter((a) => a.status === "pending"));
    setLoading(false);
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
    <Card className="p-6">
      <h2 className="text-lg font-semibold">Appointment requests</h2>
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      {loading ? (
        <p className="mt-2 text-sm text-ink-400">Loading…</p>
      ) : appointments.length === 0 ? (
        <p className="mt-2 text-sm text-ink-400">No pending requests.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {appointments.map((appointment) => (
            <li key={appointment.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{appointment.student_name ?? `Student #${appointment.student_user_id}`}</p>
                <p className="text-sm text-ink-400">{formatDateTime(appointment.slot_start)} • {appointment.mode}</p>
                {appointment.student_note ? <p className="mt-1 text-sm text-ink-400">{appointment.student_note}</p> : null}
                {appointment.concern_category ? <p className="text-xs text-ink-300">{appointment.concern_category}</p> : null}
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => void act(appointment.id, "confirmed")}>
                  Accept
                </Button>
                <Button size="sm" variant="secondary" onClick={() => void act(appointment.id, "declined")}>
                  Decline
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
