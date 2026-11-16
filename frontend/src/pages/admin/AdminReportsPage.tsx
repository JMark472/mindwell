import { useEffect, useMemo, useState } from "react";
import { Card, StatCard } from "@/components/ui/Primitives";
import {
  getAppointmentReports,
  getPlatformReports,
  getRegistrationTrend,
  getReportSummary,
} from "@/api/wellness";
import {
  BarChart3,
  Users,
  Calendar,
  FileText,
  TrendingUp,
  GraduationCap,
  UserCog,
  Activity,
  CheckCircle2,
  XCircle,
  HeartPulse,
} from "lucide-react";
import { SkeletonCard } from "@/components/ui/Feedback";

function monthLabel(value: string) {
  if (!value) return value;
  const [y, m] = value.split("-").map(Number);
  if (!y || !m) return value;
  return new Date(y, m - 1, 1).toLocaleString(undefined, { month: "short", year: "numeric" });
}

function BarList({
  title,
  items,
  empty = "No data available",
}: {
  title?: string;
  items: Array<{ label: string; value: number }>;
  empty?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="mt-4 space-y-3">
      {title ? <p className="text-xs uppercase tracking-wide text-ink-400">{title}</p> : null}
      {items.length === 0 ? <p className="text-sm text-ink-400">{empty}</p> : null}
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <div className="w-24 truncate text-sm text-ink-400" title={item.label}>{item.label}</div>
          <div className="flex-1">
            <div className="h-8 rounded-full bg-mint-soft/70">
              <div
                className="flex h-8 min-w-[2.25rem] items-center rounded-full bg-gradient-to-r from-teal to-mint px-3 text-xs font-medium text-white"
                style={{ width: `${Math.max(8, (item.value / max) * 100)}%` }}
              >
                {item.value}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminReportsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [appointments, setAppointments] = useState<any>(null);
  const [platform, setPlatform] = useState<any>(null);
  const [trend, setTrend] = useState<Array<{ month: string; count: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getReportSummary().catch(() => null),
      getRegistrationTrend(6).catch(() => ({ trend: [] })),
      getAppointmentReports().catch(() => null),
      getPlatformReports().catch(() => null),
    ])
      .then(([s, t, a, p]) => {
        setSummary(s);
        setTrend(t?.trend || []);
        setAppointments(a);
        setPlatform(p);
        if (!s && !a && !p) setError("Some report data could not be loaded. Check that the API services are running.");
      })
      .catch(() => setError("Could not load system reports."))
      .finally(() => setLoading(false));
  }, []);

  const users = summary?.users || {};
  const totalUsers = Number(users.total ?? 0);
  const students = Number(users.students ?? 0);
  const counselors = Number(users.counselors ?? 0);
  const activeUsers = Number(users.active ?? 0);
  const apptTotal = Number(appointments?.total ?? 0);

  const registrationBars = useMemo(
    () => trend.map((t) => ({ label: monthLabel(t.month), value: Number(t.count ?? 0) })),
    [trend],
  );
  const monthlyApptBars = useMemo(
    () => (appointments?.monthly || []).map((m: any) => ({ label: monthLabel(m.month), value: Number(m.total ?? 0) })),
    [appointments],
  );
  const workload = (appointments?.counselor_workload || []) as Array<{ counselor_profile_id: number; total: number; name?: string | null }>;

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="relative overflow-hidden p-6">
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-mint/20 to-teal/10 blur-3xl" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal to-mint text-white">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">System Reports & Analytics</h2>
            <p className="text-sm text-ink-400">Live platform insights from user, appointment, and wellness data</p>
          </div>
        </div>
        {error ? <p className="relative z-10 mt-3 text-sm text-amber-700">{error}</p> : null}
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Users" value={totalUsers} tone="navy" />
        <StatCard icon={GraduationCap} label="Students" value={students} tone="teal" />
        <StatCard icon={UserCog} label="Counselors" value={counselors} tone="violet" />
        <StatCard icon={Calendar} label="Appointments" value={apptTotal} tone="sky" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-teal" />
            <h2 className="text-lg font-semibold">Registration Trend (6 months)</h2>
          </div>
          <BarList items={registrationBars} />
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-teal" />
            <h2 className="text-lg font-semibold">System Overview</h2>
          </div>
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2"><Users className="h-4 w-4 text-ink-400" /><span className="text-sm">Active Users</span></div>
              <span className="text-sm font-medium">{activeUsers}</span>
            </div>
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2"><UserCog className="h-4 w-4 text-ink-400" /><span className="text-sm">Admins</span></div>
              <span className="text-sm font-medium">{Number(users.admins ?? 0)}</span>
            </div>
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-ink-400" /><span className="text-sm">Wellness Resources (total / published)</span></div>
              <span className="text-sm font-medium">{Number(platform?.total_resources ?? 0)} / {Number(platform?.published_resources ?? 0)}</span>
            </div>
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2"><HeartPulse className="h-4 w-4 text-ink-400" /><span className="text-sm">Wellness Check-ins (total / shared)</span></div>
              <span className="text-sm font-medium">{Number(platform?.checkins_total ?? 0)} / {Number(platform?.checkins_shared ?? 0)}</span>
            </div>
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-ink-400" /><span className="text-sm">Appointment Completion Rate</span></div>
              <span className="text-sm font-medium">{Number(appointments?.completion_rate ?? 0)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><XCircle className="h-4 w-4 text-ink-400" /><span className="text-sm">Cancellation/Decline Rate</span></div>
              <span className="text-sm font-medium">{Number(appointments?.cancellation_rate ?? 0)}%</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-teal" />
            <h2 className="text-lg font-semibold">Appointments by Status</h2>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {Object.entries(appointments?.by_status || { pending: 0, confirmed: 0, completed: 0, cancelled: 0 }).map(([status, count]) => (
              <div key={status} className="rounded-field border border-line p-4 text-center">
                <p className="text-sm capitalize text-ink-400">{status.replace("_", " ")}</p>
                <p className="mt-2 text-xl font-semibold">{Number(count ?? 0)}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-teal" />
            <h2 className="text-lg font-semibold">Appointments (last 6 months)</h2>
          </div>
          <BarList items={monthlyApptBars} empty="No appointment data available" />
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-2">
          <UserCog className="h-5 w-5 text-teal" />
          <h2 className="text-lg font-semibold">Counselor Workload (confirmed/completed)</h2>
        </div>
        {workload.length === 0 ? (
          <p className="mt-4 text-sm text-ink-400">No workload data available.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="bg-navy-050 text-xs uppercase tracking-wide text-ink-400">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Counselor</th>
                  <th className="px-4 py-2 text-left font-medium">Profile ID</th>
                  <th className="px-4 py-2 text-right font-medium">Appointments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70">
                {workload.map((w) => (
                  <tr key={w.counselor_profile_id}>
                    <td className="px-4 py-3 font-medium text-ink">{w.name || "Counselor"}</td>
                    <td className="px-4 py-3 text-ink-400">#{w.counselor_profile_id}</td>
                    <td className="px-4 py-3 text-right font-medium">{Number(w.total ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
