import { useEffect, useState } from "react";
import { Card, Button, Label } from "@/components/ui/Primitives";
import { getCaseload, listCounselingRecords, createCounselingRecord, type CaseloadEntry, type CounselingRecord } from "@/api/counseling";
import { useSearchParams } from "react-router";
import { errorMessage } from "@/api/client";

export default function StudentCasesPage() {
  const [caseload, setCaseload] = useState<CaseloadEntry[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [records, setRecords] = useState<CounselingRecord[]>([]);
  const [summary, setSummary] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    void getCaseload().then((data) => {
      setCaseload(data);
      const student = searchParams.get("student");
      if (student) setSelected(Number(student));
    });
  }, [searchParams]);

  useEffect(() => {
    if (!selected) return;
    void listCounselingRecords(selected).then(setRecords);
  }, [selected]);

  async function addRecord() {
    if (!selected || !summary.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await createCounselingRecord({
        student_user_id: selected,
        session_date: new Date().toISOString().slice(0, 10),
        summary: summary.trim(),
        follow_up_plan: followUp.trim() || null,
        risk_level: "none",
      });
      setSummary("");
      setFollowUp("");
      const updated = await listCounselingRecords(selected);
      setRecords(updated);
    } catch (err) {
      setError(errorMessage(err, "Could not save the session note."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <Card className="p-4">
        <h3 className="px-2 text-sm font-semibold">Caseload</h3>
        <ul className="mt-2">
          {caseload.map((entry) => (
            <li key={entry.student_user_id}>
              <button
                onClick={() => setSelected(entry.student_user_id)}
                className={`w-full rounded-field px-2 py-2 text-left text-sm ${
                  selected === entry.student_user_id ? "bg-mint-soft" : "hover:bg-navy-050"
                }`}
              >
                <p className="font-medium">{entry.name}</p>
                <p className="text-xs text-ink-400">{entry.total_sessions} sessions</p>
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-6">
        {!selected ? (
          <p className="text-sm text-ink-400">Select a student to view records.</p>
        ) : (
          <>
            <h2 className="text-lg font-semibold">Session notes</h2>
            <ul className="mt-4 divide-y divide-line">
              {records.map((record) => (
                <li key={record.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {new Date(record.session_date).toLocaleDateString("en-PH")}
                    </span>
                    <span className="text-xs text-ink-300">Risk: {record.risk_level}</span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-ink-600">{record.summary}</p>
                  {record.follow_up_plan ? (
                    <p className="mt-2 text-sm text-ink-400">
                      <span className="font-medium text-ink">Follow-up:</span> {record.follow_up_plan}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
            {records.length === 0 ? <p className="mt-2 text-sm text-ink-400">No records yet.</p> : null}

            <div className="mt-6 border-t border-line pt-6">
              <h3 className="text-base font-semibold">Add session note</h3>
              <label className="mt-3 flex flex-col gap-1.5">
                <Label htmlFor="summary">Summary (confidential)</Label>
                <textarea
                  id="summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={4}
                  className="rounded-field border border-line px-3 py-2 text-sm"
                />
              </label>
              <label className="mt-3 flex flex-col gap-1.5">
                <Label htmlFor="followUp">Follow-up plan (optional)</Label>
                <textarea
                  id="followUp"
                  value={followUp}
                  onChange={(e) => setFollowUp(e.target.value)}
                  rows={2}
                  className="rounded-field border border-line px-3 py-2 text-sm"
                />
              </label>
              {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
              <Button className="mt-3" disabled={submitting} onClick={() => void addRecord()}>
                {submitting ? "Saving…" : "Save note"}
              </Button>
              <p className="mt-2 text-xs text-ink-400">
                Only you can see these records. They are never visible to students or administrators.
              </p>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
