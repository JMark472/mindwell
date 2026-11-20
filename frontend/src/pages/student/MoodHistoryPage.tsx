import { useEffect, useMemo, useState } from "react";
import { listCheckins, getCheckinTrend, type CheckinTrendPoint } from "@/api/wellness";
import { Card, Badge, IconBadge } from "@/components/ui/Primitives";
import CheckinAdvice from "@/components/wellness/CheckinAdvice";
import { HeartPulse, Share2, CalendarDays, TrendingUp } from "lucide-react";

export default function MoodHistoryPage() {
  const [history, setHistory] = useState<Awaited<ReturnType<typeof listCheckins>>["checkins"]>([]);
  const [trend, setTrend] = useState<CheckinTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void Promise.all([
      listCheckins().then((result) => setHistory(result.checkins)).catch(() => setHistory([])),
      getCheckinTrend().then(setTrend).catch(() => setTrend([])),
    ]).finally(() => setLoading(false));
  }, []);

  const avgMood = useMemo(() => {
    if (history.length === 0) return null;
    const total = history.reduce((sum, item) => sum + (item.mood_score ?? 0), 0);
    return (total / history.length).toFixed(1);
  }, [history]);
  const sharedCount = useMemo(() => history.filter((h) => h.is_shared_with_counselor).length, [history]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4 sm:p-5"><div className="flex items-center justify-between gap-2"><div className="min-w-0"><p className="text-[10px] uppercase tracking-[0.12em] text-ink-300 sm:text-xs sm:tracking-[0.22em]">Total check-ins</p><p className="mt-2 text-2xl font-semibold sm:text-3xl">{history.length}</p><p className="mt-1 text-xs text-ink-400">Recorded reflections</p></div><IconBadge icon={CalendarDays} tone="navy" /></div></Card>
        <Card className="p-4 sm:p-5"><div className="flex items-center justify-between gap-2"><div className="min-w-0"><p className="text-[10px] uppercase tracking-[0.12em] text-ink-300 sm:text-xs sm:tracking-[0.22em]">Average mood</p><p className="mt-2 text-2xl font-semibold sm:text-3xl">{avgMood ?? "—"}</p><p className="mt-1 text-xs text-ink-400">Across all entries</p></div><IconBadge icon={HeartPulse} tone="teal" /></div></Card>
        <Card className="p-4 sm:p-5"><div className="flex items-center justify-between gap-2"><div className="min-w-0"><p className="text-[10px] uppercase tracking-[0.12em] text-ink-300 sm:text-xs sm:tracking-[0.22em]">Shared entries</p><p className="mt-2 text-2xl font-semibold sm:text-3xl">{sharedCount}</p><p className="mt-1 text-xs text-ink-400">Visible to counselor</p></div><IconBadge icon={Share2} tone="sky" /></div></Card>
        <Card className="p-4 sm:p-5"><div className="flex items-center justify-between gap-2"><div className="min-w-0"><p className="text-[10px] uppercase tracking-[0.12em] text-ink-300 sm:text-xs sm:tracking-[0.22em]">Recent trend</p><p className="mt-2 text-2xl font-semibold sm:text-3xl">{trend.length}</p><p className="mt-1 text-xs text-ink-400">Last tracked entries</p></div><IconBadge icon={TrendingUp} tone="mint" /></div></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="overflow-hidden">
          <div className="border-b border-line/70 px-4 py-5 sm:px-6">
            <h2 className="text-lg font-semibold">Recent trend</h2>
            <p className="mt-1 text-sm text-ink-400">A quick view of your latest mood, energy, and stress scores.</p>
          </div>
          {loading ? (
            <p className="px-4 py-6 text-sm text-ink-400 sm:px-6">Loading trend…</p>
          ) : trend.length === 0 ? (
            <p className="px-4 py-6 text-sm text-ink-400 sm:px-6">No trend data yet. Your check-ins will appear here.</p>
          ) : (
            <ul className="divide-y divide-line/70">
              {trend.map((point) => (
                <li key={point.id} className="flex flex-col gap-2 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-6">
                  <span className="shrink-0 text-ink-400">{new Date(point.date).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}</span>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <Badge tone="teal">Mood {point.mood}/5</Badge>
                    <Badge tone="neutral">Energy {point.energy ?? "—"}/5</Badge>
                    <Badge tone="neutral">Stress {point.stress ?? "—"}/5</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-line/70 px-4 py-5 sm:px-6">
            <h2 className="text-lg font-semibold">All check-ins</h2>
            <p className="mt-1 text-sm text-ink-400">Your reflections, privacy choices, and counselor advice (when shared).</p>
          </div>
          {loading ? (
            <p className="px-4 py-6 text-sm text-ink-400 sm:px-6">Loading check-ins…</p>
          ) : history.length === 0 ? (
            <p className="px-4 py-6 text-sm text-ink-400 sm:px-6">No check-ins yet. Start a mood check-in to track how you’re feeling.</p>
          ) : (
            <ul className="divide-y divide-line/70">
              {history.map((checkin) => (
                <li key={checkin.id} className="px-4 py-4 text-sm transition-colors hover:bg-surface-2/30 sm:px-6">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-ink">Mood {checkin.mood_score}/5</span>
                      <Badge tone={checkin.is_shared_with_counselor ? "teal" : "neutral"}>
                        {checkin.is_shared_with_counselor ? "Shared with counselor" : "Private"}
                      </Badge>
                    </div>
                    <span className="break-words text-ink-400">{new Date(checkin.created_at).toLocaleString("en-PH")}</span>
                  </div>
                  {checkin.note ? <p className="mt-2 text-ink-500">{checkin.note}</p> : <p className="mt-2 text-xs text-ink-300">No note added.</p>}
                  {checkin.counselor_advice ? (
                    <CheckinAdvice
                      advice={checkin.counselor_advice}
                      counselorName={checkin.counselor_name}
                      advisedAt={checkin.advised_at}
                    />
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
