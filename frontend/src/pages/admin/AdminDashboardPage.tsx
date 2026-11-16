import { useEffect, useState } from "react";
import { Card, Button, IconBadge, Badge } from "@/components/ui/Primitives";
import { getReportSummary, getRegistrationTrend } from "@/api/wellness";
import { appointmentAnalytics } from "@/api/appointments";
import { Link } from "react-router";
import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  GraduationCap,
  Settings,
  ShieldCheck,
  Sparkles,
  UserCog,
  Users,
} from "lucide-react";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [trend, setTrend] = useState<any>(null);
  const [appointments, setAppointments] = useState<any>(null);

  useEffect(() => {
    void getReportSummary().then(setSummary);
    void getRegistrationTrend(6).then(setTrend);
    void appointmentAnalytics().then(setAppointments).catch(() => {});
  }, []);

  const trendItems = trend?.trend ?? [];
  const maxTrend = trendItems.reduce((max: number, item: any) => Math.max(max, item.count ?? 0), 1);
  const completionRate = appointments?.completion_rate ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-gradient-to-br from-navy via-[#102a4c] to-teal p-6 text-white shadow-lift sm:p-8">
        <div className="absolute -right-24 -top-20 h-72 w-72 rounded-full bg-mint/25 blur-3xl" />
        <div className="absolute -bottom-28 left-1/4 h-80 w-80 rounded-full bg-sky/18 blur-3xl" />
        <div className="mw-grid-lines absolute inset-0 opacity-25" />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3">
            <Badge tone="teal" className="w-fit border border-white/20 bg-white/10 text-white">
              <Sparkles aria-hidden="true" className="mr-1 h-3 w-3" />
              System overview
            </Badge>
            <div>
              <p className="text-sm text-white/80">{getGreeting()}, Admin</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Mindwell at a glance
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-white/90">
                Monitor adoption, appointments, and governance from one calm control center.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="glass" className="border-white/40 bg-white/90 text-navy hover:bg-white">
                <Link to="/admin/users">
                  Manage users
                  <ArrowRight aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="ghost" className="text-white hover:bg-white/10">
                <Link to="/admin/reports">
                  View reports
                  <BarChart3 aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="ghost" className="text-white hover:bg-white/10">
                <Link to="/admin/settings">
                  System settings
                  <Settings aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
          <div className="mw-float relative hidden h-44 w-44 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-xl lg:flex">
            <div className="absolute inset-6 rounded-full bg-gradient-to-br from-mint/40 to-white/10" />
            <ShieldCheck aria-hidden="true" className="relative h-12 w-12 text-white" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="relative overflow-hidden p-6">
          <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-navy/10 blur-3xl" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-ink-300">Total users</p>
              <p className="mt-2 text-3xl font-semibold">{summary?.users?.total ?? "—"}</p>
              <p className="mt-1 text-sm text-ink-400">Across all roles</p>
            </div>
            <IconBadge icon={Users} tone="navy" />
          </div>
        </Card>
        <Card className="relative overflow-hidden p-6">
          <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-mint/10 blur-3xl" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-ink-300">Students</p>
              <p className="mt-2 text-3xl font-semibold">{summary?.users?.students ?? "—"}</p>
              <p className="mt-1 text-sm text-ink-400">Registered learners</p>
            </div>
            <IconBadge icon={GraduationCap} tone="teal" />
          </div>
        </Card>
        <Card className="relative overflow-hidden p-6">
          <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#f5f3ff]/60 blur-3xl" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-ink-300">Counselors</p>
              <p className="mt-2 text-3xl font-semibold">{summary?.users?.counselors ?? "—"}</p>
              <p className="mt-1 text-sm text-ink-400">Care providers</p>
            </div>
            <IconBadge icon={UserCog} tone="violet" />
          </div>
        </Card>
        <Card className="relative overflow-hidden p-6">
          <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-info/10 blur-3xl" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-ink-300">Active</p>
              <p className="mt-2 text-3xl font-semibold">{summary?.users?.active ?? "—"}</p>
              <p className="mt-1 text-sm text-ink-400">Enabled accounts</p>
            </div>
            <IconBadge icon={ShieldCheck} tone="sky" />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/70 px-6 py-5">
            <div>
              <h2 className="text-lg font-semibold">Appointment analytics</h2>
              <p className="mt-1 text-sm text-ink-400">Engagement and completion across the system.</p>
            </div>
            <Button asChild variant="secondary">
              <Link to="/admin/appointments">
                View appointments
                <ArrowRight aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          {appointments ? (
            <div className="grid gap-4 px-6 py-6 md:grid-cols-[0.9fr_1.1fr]">
              <div className="relative flex flex-col items-center justify-center gap-3">
                <div
                  className="relative flex h-40 w-40 items-center justify-center rounded-full"
                  style={{
                    background: `conic-gradient(var(--color-teal) ${completionRate}%, rgb(220 229 230 / 0.6) ${completionRate}% 100%)`,
                  }}
                >
                  <div className="absolute h-28 w-28 rounded-full bg-surface" />
                  <div className="relative text-center">
                    <p className="text-3xl font-semibold">{completionRate}%</p>
                    <p className="mt-1 text-xs text-ink-400">Completion</p>
                  </div>
                </div>
                <p className="text-sm text-ink-400">Completed vs total appointments</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-line/70 bg-navy-050/60 p-4">
                  <div className="flex items-center gap-2 text-sm text-ink-400">
                    <CalendarCheck aria-hidden="true" className="h-4 w-4" />
                    Total
                  </div>
                  <p className="mt-2 text-2xl font-semibold">{appointments.total}</p>
                </div>
                <div className="rounded-2xl border border-line/70 bg-success-soft/70 p-4">
                  <div className="flex items-center gap-2 text-sm text-ink-400">
                    <ShieldCheck aria-hidden="true" className="h-4 w-4" />
                    Completed
                  </div>
                  <p className="mt-2 text-2xl font-semibold">
                    {appointments.by_status?.completed ?? 0}
                  </p>
                </div>
                <div className="rounded-2xl border border-line/70 bg-warning-soft/70 p-4">
                  <div className="flex items-center gap-2 text-sm text-ink-400">
                    <BarChart3 aria-hidden="true" className="h-4 w-4" />
                    Pending
                  </div>
                  <p className="mt-2 text-2xl font-semibold">
                    {appointments.by_status?.pending ?? 0}
                  </p>
                </div>
                <div className="rounded-2xl border border-line/70 bg-danger-soft/70 p-4">
                  <div className="flex items-center gap-2 text-sm text-ink-400">
                    <Users aria-hidden="true" className="h-4 w-4" />
                    Canceled/Declined
                  </div>
                  <p className="mt-2 text-2xl font-semibold">
                    {(appointments.by_status?.cancelled ?? 0) + (appointments.by_status?.declined ?? 0)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="px-6 py-10 text-sm text-ink-400">Loading analytics…</p>
          )}
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-line/70 px-6 py-5">
            <div>
              <h2 className="text-lg font-semibold">Registrations (last 6 months)</h2>
              <p className="mt-1 text-sm text-ink-400">New accounts over time.</p>
            </div>
            <Badge tone="teal">Trend</Badge>
          </div>
          {trendItems.length === 0 ? (
            <p className="px-6 py-10 text-sm text-ink-400">Loading trend…</p>
          ) : (
            <div className="flex flex-col gap-4 px-6 py-6">
              {trendItems.map((item: any) => {
                const count = item.count ?? 0;
                const width = Math.max(8, Math.round((count / maxTrend) * 100));
                return (
                  <div key={item.month} className="flex items-center gap-4">
                    <p className="w-16 text-sm text-ink-400">{item.month}</p>
                    <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-teal to-mint"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                    <p className="w-10 text-right text-sm font-medium">{count}</p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
