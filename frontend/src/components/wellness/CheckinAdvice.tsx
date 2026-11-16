import { MessageSquareHeart } from "lucide-react";

interface CheckinAdviceProps {
  advice: string;
  counselorName?: string | null;
  advisedAt?: string | null;
}

/**
 * Read-only display of a counselor's advice on a shared mood check-in.
 * Shown to the student who created the check-in.
 */
export default function CheckinAdvice({ advice, counselorName, advisedAt }: CheckinAdviceProps) {
  return (
    <div className="mt-2 rounded-xl border border-teal/20 bg-mint-soft/60 px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-teal-600">
        <MessageSquareHeart className="h-3.5 w-3.5" />
        Advice from {counselorName || "your counselor"}
      </p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-ink-600">{advice}</p>
      {advisedAt ? (
        <p className="mt-1 text-[11px] text-ink-300">
          {new Date(advisedAt).toLocaleDateString("en-PH", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      ) : null}
    </div>
  );
}
