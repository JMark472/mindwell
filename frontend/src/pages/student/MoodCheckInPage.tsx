import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Card, Button, Badge, IconBadge } from "@/components/ui/Primitives";
import { EmptyState } from "@/components/ui/Feedback";
import CheckinAdvice from "@/components/wellness/CheckinAdvice";
import {
  listCheckins,
  createCheckin,
  getCheckinTrend,
  getConsents,
  type CheckinTrendPoint,
} from "@/api/wellness";
import { errorMessage } from "@/api/client";
import { HeartPulse, Calendar, Sparkles, ShieldCheck } from "lucide-react";

const moods = [
  { value: 1, label: "Very Low", emoji: "😢", color: "from-rose-500/20 to-rose-600/10 text-rose-600" },
  { value: 2, label: "Low", emoji: "😔", color: "from-orange-500/20 to-orange-600/10 text-orange-600" },
  { value: 3, label: "Neutral", emoji: "😐", color: "from-amber-500/20 to-amber-600/10 text-amber-600" },
  { value: 4, label: "Good", emoji: "🙂", color: "from-emerald-500/20 to-emerald-600/10 text-emerald-600" },
  { value: 5, label: "Great", emoji: "😄", color: "from-teal-500/20 to-teal-600/10 text-teal-600" },
];

export default function MoodCheckInPage() {
  const [mood, setMood] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [share, setShare] = useState(false);
  const [canShare, setCanShare] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trend, setTrend] = useState<CheckinTrendPoint[]>([]);
  const [history, setHistory] = useState<Awaited<ReturnType<typeof listCheckins>>["checkins"]>([]);

  useEffect(() => {
    void getCheckinTrend().then(setTrend).catch(() => {});
    void listCheckins().then((result) => setHistory(result.checkins)).catch(() => {});
    void getConsents()
      .then((state) => setCanShare(state.consents.checkin_sharing?.granted ?? false))
      .catch(() => setCanShare(false));
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
      <Card className="relative overflow-hidden p-6 text-center sm:p-8">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-mint/20 blur-3xl" />
        <div className="absolute -bottom-10 left-10 h-32 w-32 rounded-full bg-teal/20 blur-3xl" />
        <div className="relative z-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-mint-soft to-white">
            <HeartPulse className="h-8 w-8 text-teal" />
          </div>
          <h2 className="mt-4 text-xl font-semibold">Check-in saved</h2>
          <p className="mt-2 text-sm text-ink-400">
            Thank you for taking a moment to reflect.
            {share
              ? " Your counselor can see this check-in and may reply with advice here."
              : " Your check-in stays private to you."}
          </p>
          <Button
            className="mt-6 w-full justify-center sm:w-auto"
            onClick={() => {
              setSaved(false);
              setMood(null);
              setNote("");
              setShare(false);
            }}
          >
            <Sparkles className="h-4 w-4" />
            Check in again
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="relative overflow-hidden p-6 sm:p-8">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-mint/15 blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 h-64 w-64 rounded-full bg-teal/10 blur-3xl" />
        <div className="relative z-10">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <IconBadge icon={HeartPulse} tone="teal" />
              <div>
                <h2 className="text-xl font-semibold sm:text-2xl">How are you feeling today?</h2>
                <p className="mt-1 text-sm text-ink-400">
                  This is a voluntary reflection tool, not a diagnostic. You choose what to share.
                </p>
              </div>
            </div>
            <Badge tone="teal" className="w-fit">
              <Calendar className="mr-1 h-3 w-3" />
              {new Date().toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}
            </Badge>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {moods.map((item) => (
              <button
                key={item.value}
                onClick={() => setMood(item.value)}
                className={`group relative min-h-20 overflow-hidden rounded-2xl border p-3 text-center transition-all duration-200 sm:p-4 ${
                  mood === item.value
                    ? `border-transparent bg-gradient-to-br ${item.color} shadow-lift ring-2 ring-teal/20`
                    : "border-line/70 bg-white/80 hover:-translate-y-1 hover:border-teal/40 hover:shadow-card"
                }`}
              >
                <div className="relative z-10">
                  <div className="text-3xl">{item.emoji}</div>
                  <div className="mt-2 text-sm font-semibold">{item.label}</div>
                  <div className="mt-1 text-xs text-ink-400">Mood {item.value}/5</div>
                </div>
                {mood === item.value ? (
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-teal to-mint" />
                ) : null}
              </button>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-2">
            <label className="text-sm font-medium">Notes (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              className="w-full min-w-0 rounded-field border border-line/80 bg-white/90 px-3 py-2 text-base shadow-[inset_0_1px_0_rgb(255_255_255/0.7)] transition-all focus-visible:border-teal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/10 sm:text-sm"
              placeholder="What's been on your mind? Add any context you'd like to reflect on..."
            />
          </div>
          <div className="mt-5 rounded-2xl border border-line/80 bg-white/70 p-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mint-soft text-teal">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">May your counselor see this check-in?</p>
                <p className="mt-0.5 text-xs text-ink-400">
                  If you share it, your counselor can read this entry and send you personal advice.
                  You can change this choice for every check-in.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    aria-pressed={!share}
                    onClick={() => setShare(false)}
                    className={`min-h-11 rounded-full border px-4 py-2 text-xs font-medium transition-colors sm:min-h-0 sm:px-3 sm:py-1.5 ${
                      !share
                        ? "border-teal bg-mint-soft text-teal-600"
                        : "border-line bg-white text-ink-600 hover:border-teal/40"
                    }`}
                  >
                    Keep it private
                  </button>
                  <button
                    type="button"
                    aria-pressed={share}
                    disabled={canShare !== true}
                    onClick={() => setShare(true)}
                    className={`min-h-11 rounded-full border px-4 py-2 text-xs font-medium transition-colors sm:min-h-0 sm:px-3 sm:py-1.5 ${
                      share
                        ? "border-teal bg-mint-soft text-teal-600"
                        : "border-line bg-white text-ink-600 hover:border-teal/40"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    Share with my counselor
                  </button>
                </div>
                {canShare === false ? (
                  <p className="mt-2 text-xs text-ink-400">
                    Check-in sharing is turned off.{" "}
                    <Link to="/student/profile" className="font-medium text-teal hover:underline">
                      Update privacy settings
                    </Link>
                  </p>
                ) : null}
              </div>
            </div>
          </div>
          {error ? <p className="mt-3 break-words text-sm text-danger">{error}</p> : null}
          <Button className="mt-4 w-full justify-center sm:w-auto" disabled={!mood || submitting} onClick={() => void submit()}>
            {submitting ? "Saving…" : "Save check-in"}
          </Button>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
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
        <Card className="p-5 sm:p-6">
          <h3 className="text-base font-semibold">History</h3>
          {history.length === 0 ? (
            <EmptyState title="No check-ins yet" description="Your first check-in will appear here." />
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {history.slice(0, 6).map((checkin) => (
                <li key={checkin.id} className="py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      Mood {checkin.mood_score}/5
                      {checkin.is_shared_with_counselor ? (
                        <Badge tone="teal" className="px-2 py-0 text-[10px]">
                          Shared
                        </Badge>
                      ) : null}
                    </span>
                    <span className="text-ink-400">
                      {new Date(checkin.created_at).toLocaleDateString("en-PH")}
                    </span>
                  </div>
                  {checkin.note ? <p className="mt-1 text-ink-400">{checkin.note}</p> : null}
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

