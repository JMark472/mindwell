import { useEffect, useMemo, useState } from "react";
import { Card, Badge, IconBadge } from "@/components/ui/Primitives";
import { adminGetSettings, adminListAuditLogs } from "@/api/wellness";
import { Settings, ShieldCheck, Database, Bell, Globe, Info, Activity, Clock3, FileText } from "lucide-react";

function formatSettingValue(value: unknown) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Enabled" : "Disabled";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value;
  try {
    const json = JSON.stringify(value);
    return json.length > 80 ? `${json.slice(0, 77)}…` : json;
  } catch {
    return String(value);
  }
}

export default function AdminSettingsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [settings, setSettings] = useState<Array<{ key: string; value: unknown }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void Promise.all([
      adminListAuditLogs().then((result) => setLogs(result.logs ?? [])).catch(() => setLogs([])),
      adminGetSettings().then((rows) => setSettings(rows ?? [])).catch(() => setSettings([])),
    ]).finally(() => setLoading(false));
  }, []);

  const recentAction = logs[0]?.action ?? "No recent activity";
  const settingsPreview = useMemo(() => settings.slice(0, 8), [settings]);

  return (
    <div className="flex flex-col gap-6">
      <Card hover={false} className="relative overflow-hidden border-0 !bg-none bg-gradient-to-br from-navy via-[#102a4c] to-teal p-5 text-white shadow-lift ring-1 ring-white/10 sm:p-7 lg:p-8">
        <div className="pointer-events-none absolute -right-16 -top-14 h-44 w-44 rounded-full bg-mint/25 blur-3xl sm:-right-24 sm:-top-20 sm:h-72 sm:w-72" />
        <div className="pointer-events-none absolute -bottom-20 -left-8 h-52 w-52 rounded-full bg-sky/20 blur-3xl sm:-bottom-28 sm:left-1/4 sm:h-80 sm:w-80" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_45%)]" />
        <div className="mw-grid-lines pointer-events-none absolute inset-0 opacity-20 sm:opacity-25" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.10]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)", backgroundSize: "22px 22px" }} />
        <svg className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 w-full opacity-20 sm:h-24" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,40 C150,90 350,0 600,50 C850,100 1050,20 1200,60 L1200,120 L0,120 Z" fill="rgba(255,255,255,0.30)" />
          <path d="M0,70 C200,20 400,110 600,70 C800,30 1000,100 1200,80 L1200,120 L0,120 Z" fill="rgba(82,208,176,0.30)" />
        </svg>
        <div className="pointer-events-none absolute right-4 top-4 hidden gap-2 text-white/15 sm:right-6 sm:top-6 sm:flex sm:gap-3">
          <Settings className="h-5 w-5 sm:h-7 sm:w-7" />
          <ShieldCheck className="h-5 w-5 sm:h-7 sm:w-7" />
          <Database className="h-5 w-5 sm:h-7 sm:w-7" />
        </div>
        <div className="relative z-10 max-w-3xl">
          <div className="mb-3 inline-flex max-w-full items-center gap-2 rounded-pill bg-white/10 px-3 py-1 text-xs font-medium text-white/90 ring-1 ring-white/15 backdrop-blur shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            System settings & audit
          </div>
          <h2 className="text-xl font-semibold leading-tight tracking-tight text-white sm:text-2xl lg:text-3xl">Platform configuration overview</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
            Review key system information, configuration values, and recent administrative activity. Sensitive operations and counseling records remain protected by role-based access.
          </p>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-ink-300">Audit entries</p>
              <p className="mt-2 text-3xl font-semibold">{logs.length}</p>
              <p className="mt-1 text-xs text-ink-400">Loaded recent records</p>
            </div>
            <IconBadge icon={FileText} tone="navy" />
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-ink-300">Settings keys</p>
              <p className="mt-2 text-3xl font-semibold">{settings.length}</p>
              <p className="mt-1 text-xs text-ink-400">Stored configuration items</p>
            </div>
            <IconBadge icon={Settings} tone="teal" />
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-ink-300">Latest activity</p>
              <p className="mt-2 line-clamp-2 text-sm font-semibold">{recentAction}</p>
              <p className="mt-1 text-xs text-ink-400">Most recent audit action</p>
            </div>
            <IconBadge icon={Activity} tone="sky" />
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-ink-300">Status</p>
              <p className="mt-2 text-sm font-semibold">{loading ? "Loading…" : "Operational"}</p>
              <p className="mt-1 text-xs text-ink-400">Admin services reachable</p>
            </div>
            <IconBadge icon={ShieldCheck} tone="mint" />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-line/70 px-6 py-5">
            <div>
              <h3 className="text-lg font-semibold">System information</h3>
              <p className="mt-1 text-sm text-ink-400">Important platform details and safeguards.</p>
            </div>
            <Badge tone="teal">Overview</Badge>
          </div>
          <div className="grid gap-4 p-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-line/70 bg-surface-2/50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium"><Globe className="h-4 w-4 text-teal" /> Platform</div>
              <p className="mt-2 text-sm text-ink-600">MindWell student support platform (web)</p>
              <p className="mt-1 text-xs text-ink-400">Frontend, Express API, and Laravel services</p>
            </div>
            <div className="rounded-2xl border border-line/70 bg-surface-2/50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium"><ShieldCheck className="h-4 w-4 text-teal" /> Access control</div>
              <p className="mt-2 text-sm text-ink-600">Role-based access enforced server-side</p>
              <p className="mt-1 text-xs text-ink-400">Admins cannot access private counseling records</p>
            </div>
            <div className="rounded-2xl border border-line/70 bg-surface-2/50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium"><Bell className="h-4 w-4 text-teal" /> Notifications & audit</div>
              <p className="mt-2 text-sm text-ink-600">Administrative actions are logged for accountability</p>
              <p className="mt-1 text-xs text-ink-400">Review audit entries regularly</p>
            </div>
            <div className="rounded-2xl border border-line/70 bg-surface-2/50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium"><Info className="h-4 w-4 text-teal" /> Safety note</div>
              <p className="mt-2 text-sm text-ink-600">MindWell is not a replacement for emergency services</p>
              <p className="mt-1 text-xs text-ink-400">Users in immediate danger should seek urgent help</p>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-line/70 px-6 py-5">
            <div>
              <h3 className="text-lg font-semibold">Configuration values</h3>
              <p className="mt-1 text-sm text-ink-400">Current stored system settings.</p>
            </div>
            <Badge tone="neutral">{settings.length} keys</Badge>
          </div>
          <div className="p-6">
            {loading ? (
              <p className="text-sm text-ink-400">Loading settings…</p>
            ) : settingsPreview.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line/80 bg-surface-2/40 p-5 text-sm text-ink-400">
                No system settings are stored yet. Default application behavior is currently in effect.
              </div>
            ) : (
              <ul className="space-y-3">
                {settingsPreview.map((item) => (
                  <li key={item.key} className="rounded-2xl border border-line/70 bg-white/80 p-4 transition-all duration-300 hover:border-teal/30 hover:shadow-card">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium text-ink">{item.key}</p>
                      <Badge tone="info">Config</Badge>
                    </div>
                    <p className="mt-1 break-words text-sm text-ink-500">{formatSettingValue(item.value)}</p>
                  </li>
                ))}
              </ul>
            )}
            {settings.length > settingsPreview.length ? (
              <p className="mt-3 text-xs text-ink-400">Showing {settingsPreview.length} of {settings.length} settings.</p>
            ) : null}
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/70 px-6 py-5">
          <div>
            <h3 className="text-lg font-semibold">Audit logs</h3>
            <p className="mt-1 text-sm text-ink-400">Immutable record of administrative actions.</p>
          </div>
          <div className="inline-flex items-center gap-2 text-xs text-ink-400">
            <Clock3 className="h-4 w-4" />
            Recent entries
          </div>
        </div>
        {loading ? (
          <p className="px-6 py-6 text-sm text-ink-400">Loading audit logs…</p>
        ) : logs.length === 0 ? (
          <p className="px-6 py-6 text-sm text-ink-400">No audit entries yet.</p>
        ) : (
          <ul className="divide-y divide-line/70">
            {logs.map((log) => (
              <li key={log.id} className="px-6 py-4 transition-colors duration-200 hover:bg-surface-2/30">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-medium text-ink">{log.action}</span>
                  <span className="text-sm text-ink-400">
                    {log.createdAt ? new Date(log.createdAt).toLocaleString("en-PH") : "—"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink-400">
                  Actor {log.actorUserId ?? "—"} • {log.entityType ?? "—"} {log.entityId ?? ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
