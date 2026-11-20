import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Button, Label, Textarea } from "@/components/ui/Primitives";
import CounselorStudentLayout from "@/components/counselor/CounselorStudentLayout";
import { useCaseloadSelection } from "@/hooks/useCaseloadSelection";
import {
  createCounselingRecord,
  listCounselingRecords,
  type CounselingRecord,
} from "@/api/counseling";
import { errorMessage } from "@/api/client";
import { FileText } from "lucide-react";

/**
 * Session Notes: confidential counseling notes and follow-up plans.
 * Shared mood check-ins and advice live on Student Management.
 */
export default function SessionNotesPage() {
  const { caseload, selected, setSelected, selectedEntry } = useCaseloadSelection();
  const [records, setRecords] = useState<CounselingRecord[]>([]);
  const [summary, setSummary] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSummary("");
    setFollowUp("");
    setError(null);
    if (!selected) {
      setRecords([]);
      return;
    }
    void listCounselingRecords(selected)
      .then(setRecords)
      .catch(() => setRecords([]));
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
    <CounselorStudentLayout
      caseload={caseload}
      selected={selected}
      selectedEntry={selectedEntry}
      onSelect={setSelected}
      emptyMessage="Select a student to view or add session notes."
      headerAction={
        <Button asChild variant="secondary" className="w-full justify-center sm:w-auto">
          <Link to={`/counselor/cases?student=${selected}`}>Student management</Link>
        </Button>
      }
    >
      <h2 className="mt-4 text-lg font-semibold sm:mt-6">Session notes</h2>
      <p className="mt-1 text-sm text-ink-400">
        Private to you. Session notes are never visible to students or administrators.
      </p>

      {records.length === 0 ? (
        <div className="mw-empty-state mt-3 flex flex-col items-center gap-2 rounded-xl border border-line/70 bg-surface-2/30 px-4 py-6 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint-soft text-teal ring-1 ring-teal/20"><FileText className="h-5 w-5" /></span>
          <p className="text-sm text-ink-400">No session notes yet.</p>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {records.map((record) => (
            <li key={record.id} className="py-3">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <span className="text-sm font-medium">
                  {new Date(record.session_date).toLocaleDateString("en-PH")}
                </span>
                <span className="text-sm text-ink-300">Risk: {record.risk_level}</span>
              </div>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm text-ink-600">{record.summary}</p>
              {record.follow_up_plan ? (
                <p className="mt-2 break-words text-sm text-ink-400">
                  <span className="font-medium text-ink">Follow-up:</span> {record.follow_up_plan}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 border-t border-line pt-5 sm:mt-6 sm:pt-6">
        <h3 className="text-base font-semibold">Add session note</h3>
        <label className="mt-3 flex flex-col gap-1.5">
          <Label htmlFor="summary" className="text-sm">Summary (confidential)</Label>
          <Textarea
            id="summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={4}
            className="resize-y"
          />
        </label>
        <label className="mt-3 flex flex-col gap-1.5">
          <Label htmlFor="followUp" className="text-sm">Follow-up plan (optional)</Label>
          <Textarea
            id="followUp"
            value={followUp}
            onChange={(e) => setFollowUp(e.target.value)}
            rows={3}
            className="resize-y"
          />
        </label>
        {error ? <p className="mt-2 break-words text-sm text-danger">{error}</p> : null}
        <Button className="mt-3 w-full sm:w-auto" disabled={submitting} onClick={() => void addRecord()}>
          {submitting ? "Saving…" : "Save note"}
        </Button>
        <p className="mt-2 text-sm text-ink-400">
          Only you can see these records. They are never visible to students or administrators.
        </p>
      </div>
    </CounselorStudentLayout>
  );
}
