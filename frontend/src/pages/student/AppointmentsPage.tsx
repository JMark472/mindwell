import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Card, Button } from "@/components/ui/Primitives";
import { EmptyState } from "@/components/ui/Feedback";
import { listAppointments, type Appointment } from "@/api/appointments";
import { formatDateTime } from "@/components/ui/Helpers";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listAppointments()
      .then(setAppointments)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">My appointments</h2>
          <p className="text-sm text-ink-400">
            Track upcoming and past counseling sessions.
          </p>
        </div>
        <Button asChild>
          <Link to="/student/appointments/book">Book new appointment</Link>
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-ink-400">Loading appointments…</p>
      ) : appointments.length === 0 ? (
        <EmptyState
          title="No appointments yet"
          description="Book a session with a counselor to get started."
          action={<Button asChild><Link to="/student/appointments/book">Find a counselor</Link></Button>}
        />
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-line">
            {appointments.map((appointment) => (
              <li key={appointment.id} className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{appointment.counselor_name ?? "Counselor"}</p>
                  <p className="text-sm text-ink-400">
                    {formatDateTime(appointment.slot_start)} • {appointment.mode}
                  </p>
                  {appointment.concern_category ? (
                    <p className="text-xs text-ink-400">{appointment.concern_category}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-pill bg-navy-050 px-2 py-0.5 text-xs capitalize">
                    {appointment.status}
                  </span>
                  <Button asChild variant="ghost" size="sm">
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
