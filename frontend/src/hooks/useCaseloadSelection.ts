import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { getCaseload, type CaseloadEntry } from "@/api/counseling";

/**
 * Loads the counselor's caseload and keeps the selected student in sync with
 * the `?student=` query parameter used by dashboard and call-session links.
 */
export function useCaseloadSelection() {
  const [caseload, setCaseload] = useState<CaseloadEntry[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [searchParams] = useSearchParams();
  const studentParam = searchParams.get("student");

  useEffect(() => {
    void getCaseload()
      .then((data) => {
        setCaseload(data);
        const studentId = Number(studentParam);
        if (studentParam && Number.isFinite(studentId)) {
          setSelected(studentId);
        }
      })
      .catch(() => setCaseload([]));
  }, [studentParam]);

  const selectedEntry = caseload.find((entry) => entry.student_user_id === selected);

  return { caseload, selected, setSelected, selectedEntry };
}
