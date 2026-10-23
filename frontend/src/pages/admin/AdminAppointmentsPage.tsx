import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Primitives";
import { listAppointments, appointmentAnalytics } from "@/api/appointments";

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    void listAppointments().then(setAppointments);
    void appointmentAnalytics().then(setAnalytics).catch(() => {});
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {analytics ? (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-6">
            <p className="text-xs text-ink-400">Total</p>
            <p className="mt-1 text-xl font-semibold">{analytics.total}</p>
          </Card>
          <Card className="p-6">
            <p className="text-xs text-ink-400">Confirmed</p>
            <p className="mt-1 text-xl font-semibold">{analytics.by_status?.confirmed ?? 0}</p>
          </Card>
          <Card className="p-6">
            <p className="text-xs text-ink-400">Completed</p>
            <p className="mt-1 text-xl font-semibold">{analytics.by_status?.completed ?? 0}</p>
          </Card>
          <Card className="p-6">
            <p className="text-xs text-ink-400">Cancelled/Declined</p>
            <p className="mt-1 text-xl font-semibold">
              {(analytics.by_status?.cancelled ?? 0) + (analytics.by_status?.declined ?? 0)}
            </p>
          </Card>
        </div>
      ) : null}

      <Card className="overflow-hidden">
        <div className="px-6 py-4">
          <h2 className="text-lg font-semibold">Appointments</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-navy-050">
            <tr>
              <th className="px-6 py-2 text-left text-xs font-medium">ID</th>
              <th className="px-6 py-2 text-left text-xs font-medium">Student</th>
              <th className="px-6 py-2 text-left text-xs font-medium">Counselor</th>
              <th className="px-6 py-2 text-left text-xs font-medium">Time</th>
              <th className="px-6 py-2 text-left text-xs font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {appointments.map((appointment) => (
              <tr key={appointment.id}>
                <td className="px-6 py-3">{appointment.id}</td>
                <td className="px-6 py-3">{appointment.student_user_id}</td>
                <td className="px-6 py-3">{appointment.counselor_profile_id}</td>
                <td className="px-6 py-3 text-ink-400">
                  {new Date(appointment.slot_start).toLocaleString("en-PH")}
                </td>
                <td className="px-6 py-3 capitalize">{appointment.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
