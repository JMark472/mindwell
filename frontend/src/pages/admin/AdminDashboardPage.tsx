import { useEffect, useState } from "react";
import { Card, Button, IconBadge, Badge } from "@/components/ui/Primitives";
import { getReportSummary, getRegistrationTrend } from "@/api/wellness";
import { appointmentAnalytics } from "@/api/appointments";
import { Link } from "react-router";
import DashboardHero from "@/components/ui/DashboardHero";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  GraduationCap,
  Settings,
  ShieldCheck,
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
      <DashboardHero
        eyebrow="System overview"
        greeting={`${getGreeting()}, Admin`}
        title="Mindwell at a glance"
        description="Monitor adoption, appointments, and governance from one calm control center."
        icon={ShieldCheck}
        actions={
          <>
            <Button asChild className="w-full justify-center sm:w-auto">
              <Link to="/admin/users">
                Manage users
                <ArrowRight aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary" className="w-full justify-center sm:w-auto">
              <Link to="/admin/reports">
                View reports
                <BarChart3 aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-center sm:w-auto">
              <Link to="/admin/settings">
                System settings
                <Settings aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="relative overflow-hidden p-5 sm:p-6">
          <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-navy/10 blur-3xl" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-ink-300">Total users</p>
              <p className="mt-2 text-3xl font-semibold"><AnimatedCounter value={summary?.users?.total ?? "—"} /></p>
              <p className="mt-1 text-sm text-ink-400">Across all roles</p>
            </div>
            <IconBadge icon={Users} tone="navy" />
          </div>
        </Card>
        <Card className="relative overflow-hidden p-5 sm:p-6">
          <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-mint/10 blur-3xl" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-ink-300">Students</p>
              <p className="mt-2 text-3xl font-semibold"><AnimatedCounter value={summary?.users?.students ?? "—"} /></p>
              <p className="mt-1 text-sm text-ink-400">Registered learners</p>
            </div>
            <IconBadge icon={GraduationCap} tone="teal" />
          </div>
        </Card>
        <Card className="relative overflow-hidden p-5 sm:p-6">
          <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#f5f3ff]/60 blur-3xl" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-ink-300">Counselors</p>
              <p className="mt-2 text-3xl font-semibold"><AnimatedCounter value={summary?.users?.counselors ?? "—"} /></p>
              <p className="mt-1 text-sm text-ink-400">Care providers</p>
            </div>
            <IconBadge icon={UserCog} tone="violet" />
          </div>
        </Card>
        <Card className="relative overflow-hidden p-5 sm:p-6">
          <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-info/10 blur-3xl" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-ink-300">Active</p>
              <p className="mt-2 text-3xl font-semibold"><AnimatedCounter value={summary?.users?.active ?? "—"} /></p>
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
                  <div className="flex items-center gap-2 text-sm text-ink-500">
                    <CalendarCheck aria-hidden="true" className="h-4 w-4" />
                    Total
                  </div>
                  <p className="mt-2 text-2xl font-semibold">{appointments.total}</p>
                </div>
                <div className="rounded-2xl border border-line/70 bg-success-soft/70 p-4">
                  <div className="flex items-center gap-2 text-sm text-ink-500">
                    <ShieldCheck aria-hidden="true" className="h-4 w-4" />
                    Completed
                  </div>
                  <p className="mt-2 text-2xl font-semibold">
                    {appointments.by_status?.completed ?? 0}
                  </p>
                </div>
                <div className="rounded-2xl border border-line/70 bg-warning-soft/70 p-4">
                  <div className="flex items-center gap-2 text-sm text-ink-500">
                    <BarChart3 aria-hidden="true" className="h-4 w-4" />
                    Pending
                  </div>
                  <p className="mt-2 text-2xl font-semibold">
                    {appointments.by_status?.pending ?? 0}
                  </p>
                </div>
                <div className="rounded-2xl border border-line/70 bg-danger-soft/70 p-4">
                  <div className="flex items-center gap-2 text-sm text-ink-500">
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
