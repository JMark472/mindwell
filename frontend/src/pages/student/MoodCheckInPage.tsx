import { useEffect, useState } from "react";
import { Card, Button } from "@/components/ui/Primitives";
import { EmptyState } from "@/components/ui/Feedback";
import { listCheckins, createCheckin, getCheckinTrend, type CheckinTrendPoint } from "@/api/wellness";
import { errorMessage } from "@/api/client";

const moods = [
  { value: 1, label: "Low" },
  { value: 2, label: "Struggling" },
  { value: 3, label: "Okay" },
  { value: 4, label: "Good" },
  { value: 5, label: "Great" },
];

export default function MoodCheckInPage() {
  const [mood, setMood] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [share, setShare] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trend, setTrend] = useState<CheckinTrendPoint[]>([]);
  const [history, setHistory] = useState<Awaited<ReturnType<typeof listCheckins>>["checkins"]>([]);

  useEffect(() => {
    void getCheckinTrend().then(setTrend).catch(() => {});
    void listCheckins().then((result) => setHistory(result.checkins)).catch(() => {});
  }, []);

  async function submit() {
    if (!mood) return;
    setSubmitting(true);
    setError(null);
    try {
      await createCheckin({
        mood_score: mood,
        note: note.trim() || null,
        share_with_counselor: share,
        influences: [],
      });
      setSaved(true);
      const updated = await listCheckins();
      setHistory(updated.checkins);
      const t = await getCheckinTrend();
      setTrend(t);
    } catch (err) {
      setError(errorMessage(err, "Could not save your check-in."));
    } finally {
      setSubmitting(false);
    }
  }

  if (saved) {
    return (
      <Card className="p-8 text-center">
        <h2 className="text-lg font-semibold">Check-in saved</h2>
        <p className="mt-1 text-sm text-ink-400">
          Thank you for taking a moment to reflect. Your check-in is private by
          default.
        </p>
        <Button
          className="mt-4"
          onClick={() => {
            setSaved(false);
            setMood(null);
            setNote("");
            setShare(false);
          }}
        >
          Check in again
        </Button>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold">How are you feeling today?</h2>
        <p className="mt-1 text-sm text-ink-400">
          This is a voluntary reflection tool, not a diagnostic. You choose what
          to share.
        </p>
        <div className="mt-4 grid grid-cols-5 gap-2">
          {moods.map((item) => (
            <button
              key={item.value}
              onClick={() => setMood(item.value)}
              className={`rounded-field border px-3 py-3 text-center transition-colors ${
                mood === item.value
                  ? "border-teal bg-mint-soft text-navy"
                  : "border-line hover:bg-navy-050"
              }`}
            >
              <div className="text-lg font-semibold">{item.value}</div>
              <div className="text-xs text-ink-400">{item.label}</div>
            </button>
          ))}
        </div>
        <label className="mt-4 flex flex-col gap-1.5">
          <span className="text-sm font-medium">Notes (optional)</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            className="rounded-field border border-line px-3 py-2 text-sm"
            placeholder="What's been on your mind?"
          />
        </label>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={share}
            onChange={(e) => setShare(e.target.checked)}
          />
          Share this check-in with my counselor (requires consent)
        </label>
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
        <Button className="mt-4" disabled={!mood || submitting} onClick={() => void submit()}>
          {submitting ? "Saving…" : "Save check-in"}
        </Button>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-base font-semibold">Last 7 check-ins</h3>
          {trend.length === 0 ? (
            <p className="mt-2 text-sm text-ink-400">No trend data yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {trend.map((point) => (
                <li key={point.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-ink-400">
                    {new Date(point.date).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                  </span>
                  <span>Mood {point.mood}/5</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="p-6">
          <h3 className="text-base font-semibold">History</h3>
          {history.length === 0 ? (
            <EmptyState title="No check-ins yet" description="Your first check-in will appear here." />
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {history.slice(0, 6).map((checkin) => (
                <li key={checkin.id} className="py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Mood {checkin.mood_score}/5</span>
                    <span className="text-ink-400">
                      {new Date(checkin.created_at).toLocaleDateString("en-PH")}
                    </span>
                  </div>
                  {checkin.note ? <p className="mt-1 text-ink-400">{checkin.note}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
