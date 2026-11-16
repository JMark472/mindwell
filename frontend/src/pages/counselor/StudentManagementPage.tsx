import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/Primitives";
import CounselorStudentLayout from "@/components/counselor/CounselorStudentLayout";
import { useCaseloadSelection } from "@/hooks/useCaseloadSelection";
import { listCheckins, sendCheckinAdvice, type Checkin } from "@/api/wellness";
import { errorMessage } from "@/api/client";

/**
 * Student Management: shared mood check-ins and counselor advice.
 * Confidential session notes live on their own page.
 */
export default function StudentManagementPage() {
  const { caseload, selected, setSelected, selectedEntry } = useCaseloadSelection();
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [adviceDrafts, setAdviceDrafts] = useState<Record<number, string>>({});
  const [adviceSavingId, setAdviceSavingId] = useState<number | null>(null);
  const [adviceError, setAdviceError] = useState<string | null>(null);
  const [adviceNotice, setAdviceNotice] = useState<string | null>(null);

  useEffect(() => {
    setAdviceDrafts({});
    setAdviceError(null);
    setAdviceNotice(null);
    if (!selected) {
      setCheckins([]);
      return;
    }
    void listCheckins({ student: selected })
      .then((result) => setCheckins(result.checkins))
      .catch(() => setCheckins([]));
  }, [selected]);

  async function sendAdvice(checkinId: number) {
    const advice = (adviceDrafts[checkinId] ?? "").trim();
    if (!advice) return;
    setAdviceSavingId(checkinId);
    setAdviceError(null);
    setAdviceNotice(null);
    try {
      const updated = await sendCheckinAdvice(checkinId, advice);
      setCheckins((prev) => prev.map((checkin) => (checkin.id === checkinId ? updated : checkin)));
      setAdviceDrafts((prev) => ({ ...prev, [checkinId]: "" }));
      setAdviceNotice("Advice sent. The student will see it in their mood history.");
    } catch (err) {
      setAdviceError(errorMessage(err, "Could not send advice."));
    } finally {
      setAdviceSavingId(null);
    }
  }

  const sharedCheckins = checkins.filter((checkin) => checkin.is_shared_with_counselor);

  return (
    <CounselorStudentLayout
      caseload={caseload}
      selected={selected}
      selectedEntry={selectedEntry}
      onSelect={setSelected}
      emptyMessage="Select a student to view their shared mood check-ins."
      headerAction={
        <Button asChild variant="secondary" size="sm">
          <Link to={`/counselor/notes?student=${selected}`}>Session notes</Link>
        </Button>
      }
    >
      <h2 className="mt-6 text-lg font-semibold">Shared mood check-ins</h2>
      <p className="mt-1 text-xs text-ink-400">
        Only check-ins the student chose to share with consent are shown. Your advice is visible to
        the student.
      </p>

      {sharedCheckins.length === 0 ? (
        <p className="mt-2 text-sm text-ink-400">No shared check-ins from this student yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {sharedCheckins.map((checkin) => (
            <li key={checkin.id} className="py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Mood {checkin.mood_score}/5</span>
                <span className="text-xs text-ink-300">
                  {new Date(checkin.created_at).toLocaleDateString("en-PH", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              {checkin.note ? (
                <p className="mt-1 whitespace-pre-wrap text-sm text-ink-600">{checkin.note}</p>
              ) : (
                <p className="mt-1 text-sm text-ink-400">No note provided.</p>
              )}

              {checkin.counselor_advice ? (
                <div className="mt-2 rounded-xl border border-teal/20 bg-mint-soft/50 px-3 py-2">
                  <p className="text-xs font-semibold text-teal-600">
                    Advice shared
                    {checkin.advised_at
                      ? ` · ${new Date(checkin.advised_at).toLocaleDateString("en-PH", {
                          month: "short",
                          day: "numeric",
                        })}`
                      : ""}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-ink-600">
                    {checkin.counselor_advice}
                  </p>
                </div>
              ) : null}

              <label className="mt-3 flex flex-col gap-1.5">
                <span className="text-xs font-medium text-ink-600">
                  {checkin.counselor_advice ? "Update your advice" : "Advice for the student"}
                </span>
                <textarea
                  value={adviceDrafts[checkin.id] ?? ""}
                  onChange={(e) =>
                    setAdviceDrafts((prev) => ({ ...prev, [checkin.id]: e.target.value }))
                  }
                  rows={2}
                  placeholder="Share a supportive next step or reflection…"
                  className="rounded-field border border-line/80 bg-white/90 px-3 py-2 text-sm transition-all focus-visible:border-teal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/10"
                />
              </label>
              <Button
                className="mt-2"
                disabled={adviceSavingId === checkin.id || !(adviceDrafts[checkin.id] ?? "").trim()}
                onClick={() => void sendAdvice(checkin.id)}
              >
                {adviceSavingId === checkin.id
                  ? "Sending…"
                  : checkin.counselor_advice
                    ? "Update advice"
                    : "Send advice"}
              </Button>
            </li>
          ))}
        </ul>
      )}

      {adviceNotice ? <p className="mt-2 text-sm text-teal-600">{adviceNotice}</p> : null}
      {adviceError ? <p className="mt-2 text-sm text-danger">{adviceError}</p> : null}
    </CounselorStudentLayout>
  );
}
