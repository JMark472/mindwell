import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Primitives";
import { listAppointments, type Appointment } from "@/api/appointments";
import { formatDateTime } from "@/components/ui/Helpers";

export default function CounselorSchedulePage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    void listAppointments().then((all) =>
      setAppointments(
        all
          .filter((a) => a.status === "confirmed" || a.status === "pending")
          .sort((a, b) => a.slot_start.localeCompare(b.slot_start)),
      ),
    );
  }, []);

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold">Schedule</h2>
      <ul className="mt-4 divide-y divide-line">
        {appointments.map((appointment) => (
          <li key={appointment.id} className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">{appointment.student_name ?? `Student #${appointment.student_user_id}`}</p>
              <p className="text-sm text-ink-400">{formatDateTime(appointment.slot_start)} • {appointment.mode}</p>
            </div>
            <span className="rounded-pill bg-navy-050 px-2 py-0.5 text-xs capitalize">{appointment.status}</span>
          </li>
        ))}
      </ul>
      {appointments.length === 0 ? <p className="mt-2 text-sm text-ink-400">No upcoming sessions.</p> : null}
    </Card>
  );
}
