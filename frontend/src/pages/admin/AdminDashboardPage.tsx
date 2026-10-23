import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Primitives";
import { getReportSummary, getRegistrationTrend } from "@/api/wellness";
import { appointmentAnalytics } from "@/api/appointments";

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [trend, setTrend] = useState<any>(null);
  const [appointments, setAppointments] = useState<any>(null);

  useEffect(() => {
    void getReportSummary().then(setSummary);
    void getRegistrationTrend(6).then(setTrend);
    void appointmentAnalytics().then(setAppointments).catch(() => {});
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <p className="text-xs text-ink-400">Total users</p>
          <p className="mt-1 text-2xl font-semibold">{summary?.users?.total ?? "—"}</p>
        </Card>
        <Card className="p-6">
          <p className="text-xs text-ink-400">Students</p>
          <p className="mt-1 text-2xl font-semibold">{summary?.users?.students ?? "—"}</p>
        </Card>
        <Card className="p-6">
          <p className="text-xs text-ink-400">Counselors</p>
          <p className="mt-1 text-2xl font-semibold">{summary?.users?.counselors ?? "—"}</p>
        </Card>
        <Card className="p-6">
          <p className="text-xs text-ink-400">Active</p>
          <p className="mt-1 text-2xl font-semibold">{summary?.users?.active ?? "—"}</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-lg font-semibold">Appointment analytics</h2>
          {appointments ? (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-field bg-navy-050 p-3">
                <p className="text-xs text-ink-400">Total</p>
                <p className="text-lg font-semibold">{appointments.total}</p>
              </div>
              <div className="rounded-field bg-success-soft p-3">
                <p className="text-xs text-ink-400">Completion rate</p>
                <p className="text-lg font-semibold">{appointments.completion_rate}%</p>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-ink-400">Loading analytics…</p>
          )}
        </Card>
        <Card className="p-6">
          <h2 className="text-lg font-semibold">Registrations (last 6 months)</h2>
          <ul className="mt-4 divide-y divide-line">
            {trend?.trend?.map((item: any) => (
              <li key={item.month} className="flex items-center justify-between py-2 text-sm">
                <span>{item.month}</span>
                <span>{item.count}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
