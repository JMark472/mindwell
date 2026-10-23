import { useEffect, useState } from "react";
import { Card, Button } from "@/components/ui/Primitives";
import { listAppointments, type Appointment } from "@/api/appointments";
import { getCaseload, type CaseloadEntry } from "@/api/counseling";
import { formatDateTime } from "@/components/ui/Helpers";
import { Link } from "react-router";

export default function CounselorDashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [caseload, setCaseload] = useState<CaseloadEntry[]>([]);

  useEffect(() => {
    void listAppointments().then(setAppointments);
    void getCaseload().then(setCaseload);
  }, []);

  const pending = appointments.filter((a) => a.status === "pending");

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <p className="text-xs text-ink-400">Pending requests</p>
          <p className="mt-1 text-2xl font-semibold">{pending.length}</p>
        </Card>
        <Card className="p-6">
          <p className="text-xs text-ink-400">Total appointments</p>
          <p className="mt-1 text-2xl font-semibold">{appointments.length}</p>
        </Card>
        <Card className="p-6">
          <p className="text-xs text-ink-400">Active caseload</p>
          <p className="mt-1 text-2xl font-semibold">{caseload.length}</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Appointment requests</h2>
          <Button asChild variant="ghost">
            <Link to="/counselor/requests">View all</Link>
          </Button>
        </div>
        <ul className="mt-4 divide-y divide-line">
          {pending.slice(0, 4).map((appointment) => (
            <li key={appointment.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">{appointment.student_name ?? `Student #${appointment.student_user_id}`}</p>
                <p className="text-sm text-ink-400">{formatDateTime(appointment.slot_start)}</p>
              </div>
              <Button asChild size="sm" variant="secondary">
                <Link to="/counselor/requests">Review</Link>
              </Button>
            </li>
          ))}
        </ul>
        {pending.length === 0 ? <p className="mt-2 text-sm text-ink-400">No pending requests.</p> : null}
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold">My caseload</h2>
        <ul className="mt-4 divide-y divide-line">
          {caseload.slice(0, 5).map((entry) => (
            <li key={entry.student_user_id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">{entry.name}</p>
                <p className="text-sm text-ink-400">{entry.total_sessions} sessions</p>
              </div>
              <Button asChild size="sm" variant="ghost">
                <Link to={`/counselor/cases?student=${entry.student_user_id}`}>Open case</Link>
              </Button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
