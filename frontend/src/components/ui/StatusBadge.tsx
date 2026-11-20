import { Badge } from "@/components/ui/Primitives";
import { cn } from "@/utils/cn";

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "teal";

const statusMap: Record<string, { label: string; tone: Tone }> = {
  pending: { label: "Pending", tone: "warning" },
  confirmed: { label: "Confirmed", tone: "success" },
  active: { label: "Active", tone: "info" },
  in_progress: { label: "In Progress", tone: "info" },
  completed: { label: "Completed", tone: "teal" },
  cancelled: { label: "Cancelled", tone: "danger" },
  declined: { label: "Declined", tone: "danger" },
  approved: { label: "Approved", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
  draft: { label: "Draft", tone: "neutral" },
  published: { label: "Published", tone: "success" },
  archived: { label: "Archived", tone: "neutral" },
  shared: { label: "Shared", tone: "info" },
  private: { label: "Private", tone: "neutral" },
};

export default function StatusBadge({
  status,
  label,
  className,
}: {
  status: string;
  label?: string;
  className?: string;
}) {
  const normalized = status.toLowerCase().replace(/[\s-]+/g, "_");
  const config = statusMap[normalized] ?? {
    label: status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown",
    tone: "neutral" as Tone,
  };

  return (
    <Badge tone={config.tone} className={cn("whitespace-nowrap font-semibold", className)}>
      {label ?? config.label}
    </Badge>
  );
}
