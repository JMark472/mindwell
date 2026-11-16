import type { ReactNode } from "react";
import { Card } from "@/components/ui/Primitives";
import UserAvatar from "@/components/profile/UserAvatar";
import type { CaseloadEntry } from "@/api/counseling";

interface CounselorStudentLayoutProps {
  caseload: CaseloadEntry[];
  selected: number | null;
  selectedEntry?: CaseloadEntry;
  onSelect: (studentId: number) => void;
  emptyMessage: string;
  headerAction?: ReactNode;
  children: ReactNode;
}

/**
 * Shared caseload sidebar + selected-student header for the counselor's
 * Student Management and Session Notes pages.
 */
export default function CounselorStudentLayout({
  caseload,
  selected,
  selectedEntry,
  onSelect,
  emptyMessage,
  headerAction,
  children,
}: CounselorStudentLayoutProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <Card className="p-4">
        <h3 className="px-2 text-sm font-semibold">Caseload</h3>
        {caseload.length === 0 ? (
          <p className="px-2 py-3 text-xs text-ink-400">No students in your caseload yet.</p>
        ) : (
          <ul className="mt-2">
            {caseload.map((entry) => (
              <li key={entry.student_user_id}>
                <button
                  onClick={() => onSelect(entry.student_user_id)}
                  className={`flex w-full items-center gap-2.5 rounded-field px-2 py-2 text-left text-sm ${
                    selected === entry.student_user_id ? "bg-mint-soft" : "hover:bg-navy-050"
                  }`}
                >
                  <UserAvatar
                    user={{
                      fullName: entry.name,
                      avatarUrl: entry.avatar_url ?? null,
                    }}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{entry.name}</p>
                    <p className="text-xs text-ink-400">{entry.total_sessions} sessions</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-6">
        {!selected ? (
          <p className="text-sm text-ink-400">{emptyMessage}</p>
        ) : (
          <>
            <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <UserAvatar
                  user={{
                    fullName: selectedEntry?.name ?? "Student",
                    avatarUrl: selectedEntry?.avatar_url ?? null,
                  }}
                  size="lg"
                />
                <div>
                  <h2 className="text-lg font-semibold">{selectedEntry?.name ?? "Student"}</h2>
                  <p className="text-xs text-ink-400">
                    {selectedEntry?.total_sessions ?? 0} sessions
                    {selectedEntry?.last_session
                      ? ` · Last seen ${new Date(selectedEntry.last_session).toLocaleDateString("en-PH", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}`
                      : ""}
                  </p>
                </div>
              </div>
              {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
            </div>

            {children}
          </>
        )}
      </Card>
    </div>
  );
}
