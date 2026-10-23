import { useEffect, useState } from "react";
import { listCheckins, getCheckinTrend, type CheckinTrendPoint } from "@/api/wellness";
import { Card } from "@/components/ui/Primitives";

export default function MoodHistoryPage() {
  const [history, setHistory] = useState<Awaited<ReturnType<typeof listCheckins>>["checkins"]>([]);
  const [trend, setTrend] = useState<CheckinTrendPoint[]>([]);

  useEffect(() => {
    void listCheckins().then((result) => setHistory(result.checkins));
    void getCheckinTrend().then(setTrend);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold">Mood history (last 7 entries)</h2>
        {trend.length === 0 ? (
          <p className="mt-2 text-sm text-ink-400">No data yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {trend.map((point) => (
              <li key={point.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-ink-400">
                  {new Date(point.date).toLocaleDateString("en-PH")}
                </span>
                <span>Mood {point.mood}/5 • Energy {point.energy ?? "—"}/5 • Stress {point.stress ?? "—"}/5</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card className="p-6">
        <h2 className="text-lg font-semibold">All check-ins</h2>
        <ul className="mt-4 divide-y divide-line">
          {history.map((checkin) => (
            <li key={checkin.id} className="py-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">Mood {checkin.mood_score}/5</span>
                <span className="text-ink-400">
                  {new Date(checkin.created_at).toLocaleString("en-PH")}
                </span>
              </div>
              {checkin.note ? <p className="mt-1 text-ink-400">{checkin.note}</p> : null}
              <p className="mt-1 text-xs text-ink-300">
                {checkin.is_shared_with_counselor ? "Shared with counselor" : "Private"}
              </p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
