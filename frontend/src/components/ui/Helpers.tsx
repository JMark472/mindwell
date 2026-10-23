import { cn } from "@/utils/cn";

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface DayWindow {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export function AvailabilityGrid({ availability }: { availability: DayWindow[] }) {
  if (availability.length === 0) {
    return <p className="text-sm text-ink-400">No availability published yet.</p>;
  }

  return (
    <ul className="divide-y divide-line">
      {availability.map((window, index) => (
        <li key={index} className="flex items-center justify-between py-2 text-sm">
          <span className="font-medium">{dayNames[window.day_of_week]}</span>
          <span className="text-ink-600">
            {window.start_time} – {window.end_time}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, "neutral" | "success" | "warning" | "danger" | "info"> = {
    pending: "warning",
    confirmed: "success",
    completed: "info",
    cancelled: "neutral",
    declined: "danger",
    draft: "neutral",
    published: "success",
    archived: "neutral",
    active: "success",
    inactive: "neutral",
    suspended: "danger",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill px-2 py-0.5 text-[11px] font-medium",
        {
          "bg-warning-soft text-warning": map[status] === "warning",
          "bg-success-soft text-success": map[status] === "success",
          "bg-info-soft text-info": map[status] === "info",
          "bg-danger-soft text-danger": map[status] === "danger",
          "bg-navy-050 text-ink-600": map[status] === "neutral",
        },
      )}
    >
      {status.replace("_", " ")}
    </span>
  );
}

export function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-PH", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-PH", {
      dateStyle: "medium",
    });
  } catch {
    return iso;
  }
}

export function truncate(text: string | null | undefined, max = 140) {
  if (!text) return "";
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
}
