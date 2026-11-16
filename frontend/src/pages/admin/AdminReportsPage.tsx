import { useEffect, useState } from "react";
import { Card, StatCard } from "@/components/ui/Primitives";
import { getReportSummary, getRegistrationTrend } from "@/api/wellness";
import { BarChart3, Users, Calendar, FileText, TrendingUp, GraduationCap, UserCog } from "lucide-react";
import { SkeletonCard } from "@/components/ui/Feedback";

export default function AdminReportsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getReportSummary(), getRegistrationTrend(6)])
      .then(([s, t]) => {
        setSummary(s);
        setTrend(t.trend || []);
      })
      .finally(() => setLoading(false));
  }, []);

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
            <p className="text-sm text-ink-400">Comprehensive insights into platform usage and engagement</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Users" value={summary?.totals?.users ?? 0} tone="navy" />
        <StatCard icon={GraduationCap} label="Students" value={summary?.totals?.students ?? 0} tone="teal" />
        <StatCard icon={UserCog} label="Counselors" value={summary?.totals?.counselors ?? 0} tone="violet" />
        <StatCard icon={Calendar} label="Appointments" value={summary?.totals?.appointments ?? 0} tone="sky" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-teal" />
            <h2 className="text-lg font-semibold">Registration Trend (6 months)</h2>
          </div>
          <div className="mt-6 space-y-3">
            {trend.length === 0 ? (
              <p className="text-sm text-ink-400">No data available</p>
            ) : (
              trend.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-20 text-sm text-ink-400">{item.label}</div>
                  <div className="flex-1">
                    <div className="h-8 rounded-full bg-mint-soft">
                      <div
                        className="flex h-8 items-center rounded-full bg-gradient-to-r from-teal to-mint px-3 text-xs font-medium text-white"
                        style={{ width: `${Math.max(10, (item.count / Math.max(...trend.map((t: any) => t.count), 1)) * 100)}%` }}
                      >
                        {item.count}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-teal" />
            <h2 className="text-lg font-semibold">System Overview</h2>
          </div>
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-ink-400" />
                <span className="text-sm">Wellness Resources</span>
              </div>
              <span className="text-sm font-medium">{summary?.totals?.resources ?? 0}</span>
            </div>
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-ink-400" />
                <span className="text-sm">Appointments (30 days)</span>
              </div>
              <span className="text-sm font-medium">{summary?.appointmentsLast30Days ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-ink-400" />
                <span className="text-sm">Active Users</span>
              </div>
              <span className="text-sm font-medium">{summary?.totals?.users ?? 0}</span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold">Appointments by Status</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {summary?.appointmentsByStatus &&
            Object.entries(summary.appointmentsByStatus).map(([status, count]: [string, any]) => (
              <div key={status} className="rounded-field border border-line p-4 text-center">
                <p className="text-sm capitalize text-ink-400">{status.replace("_", " ")}</p>
                <p className="mt-2 text-xl font-semibold">{count}</p>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
}
