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
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
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
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-navy-050">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium sm:px-6">ID</th>
                <th className="px-4 py-2 text-left text-xs font-medium sm:px-6">Student</th>
                <th className="px-4 py-2 text-left text-xs font-medium sm:px-6">Counselor</th>
                <th className="px-4 py-2 text-left text-xs font-medium sm:px-6">Time</th>
                <th className="px-4 py-2 text-left text-xs font-medium sm:px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {appointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td className="px-4 py-3 sm:px-6">{appointment.id}</td>
                  <td className="px-4 py-3 sm:px-6">{appointment.student_user_id}</td>
                  <td className="px-4 py-3 sm:px-6">{appointment.counselor_profile_id}</td>
                  <td className="px-4 py-3 text-ink-400 sm:px-6">
                    {new Date(appointment.slot_start).toLocaleString("en-PH")}
                  </td>
                  <td className="px-4 py-3 capitalize sm:px-6">{appointment.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
