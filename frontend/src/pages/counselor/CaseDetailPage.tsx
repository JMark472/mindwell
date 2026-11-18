import { Card, Button, Badge } from "@/components/ui/Primitives";
import { Link } from "react-router";
import { UserRound, CalendarClock, FileText, ShieldAlert, Info } from "lucide-react";

export default function CaseDetailPage() {
  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="flex flex-col gap-6">
        <Card className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-mint-soft to-white text-sm font-semibold text-navy ring-1 ring-teal/20">
                <UserRound className="h-5 w-5 text-teal" />
              </div>
              <div>
                <Badge tone="info" className="mb-2">Case overview (sample layout)</Badge>
                <h2 className="text-lg font-semibold">Student case summary</h2>
                <p className="mt-1 text-sm text-ink-400">Use this view to review case context, timeline, and follow-up details. Replace sample details with actual case data when integrated.</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge tone="success">Active status</Badge>
                  <Badge tone="warning">Concern category</Badge>
                </div>
              </div>
            </div>
            <Button asChild variant="secondary">
              <Link to="/counselor/messages">Open in messages</Link>
            </Button>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-line/70 px-6 py-5">
            <h3 className="flex items-center gap-2 text-base font-semibold"><FileText className="h-4 w-4 text-teal" /> Session timeline</h3>
            <p className="mt-1 text-sm text-ink-400">Chronological case events and session-related updates.</p>
          </div>
          <ul className="divide-y divide-line/70">
            {[
              { title: "Session note filed", date: "Date recorded", detail: "Summary of session outcomes and observations." },
              { title: "Follow-up session", date: "Date recorded", detail: "Progress, next steps, and support plan." },
              { title: "Request accepted", date: "Date recorded", detail: "Counselor accepted the appointment/request." },
              { title: "Request received", date: "Date recorded", detail: "Initial support request submitted by student." },
            ].map((item) => (
              <li key={item.title} className="px-6 py-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-medium text-ink">{item.title}</p>
                  <span className="text-xs text-ink-400">{item.date}</span>
                </div>
                <p className="mt-1 text-sm text-ink-500">{item.detail}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="flex flex-col gap-6">
        <Card className="p-6">
          <h3 className="flex items-center gap-2 text-base font-semibold"><CalendarClock className="h-4 w-4 text-teal" /> Next follow-up</h3>
          <p className="mt-2 text-sm text-ink-600">Scheduled date and time will appear here.</p>
          <div className="mt-3 rounded-2xl border border-line/70 bg-surface-2/40 p-3 text-sm text-ink-500">No follow-up scheduled in this sample view.</div>
          <Button className="mt-4 w-full" variant="secondary">Manage follow-up</Button>
        </Card>

        <Card className="p-6">
          <h3 className="text-base font-semibold">Concern</h3>
          <p className="mt-2 text-sm text-ink-600">Primary concern category and brief context for the case.</p>
          <div className="mt-3 rounded-2xl border border-line/70 bg-surface-2/40 p-3 text-sm text-ink-500">Add concern details from intake/session notes.</div>
        </Card>

        <Card className="p-6">
          <h3 className="flex items-center gap-2 text-base font-semibold"><ShieldAlert className="h-4 w-4 text-teal" /> Risk flags</h3>
          <p className="mt-2 text-sm text-ink-400">Track any risk indicators that require attention or follow-up.</p>
          <div className="mt-3">
            <Badge tone="success">No current flags (sample)</Badge>
          </div>
        </Card>

        <Card className="border-warning/40 bg-warning-soft/70 p-4">
          <p className="flex items-start gap-2 text-xs text-warning-800">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Access only the records you need and keep student information confidential in accordance with platform policies.</span>
          </p>
        </Card>
      </div>
    </div>
  );
}
