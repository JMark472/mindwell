import { Card, Button, Badge } from "@/components/ui/Primitives";
import { Link } from "react-router";
import { CheckCircle2, CalendarClock, Bell, Info } from "lucide-react";

export default function BookingConfirmationPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Card className="relative overflow-hidden p-8 text-center sm:p-10">
        <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-success/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 left-8 h-40 w-40 rounded-full bg-teal/10 blur-3xl" />
        <div className="relative z-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-success ring-1 ring-success/20">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <Badge tone="success" className="mt-4">Request submitted</Badge>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">Appointment requested</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-ink-400">
            Your counseling appointment request has been submitted. Your counselor will review and confirm it, and you’ll receive a notification when there’s an update.
          </p>

          <div className="mt-6 grid gap-3 text-left sm:grid-cols-3">
            <div className="rounded-2xl border border-line/70 bg-surface-2/40 p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-ink-300"><CalendarClock className="h-3.5 w-3.5" /> Status</div>
              <p className="mt-2 text-sm font-medium text-ink">Pending confirmation</p>
              <p className="mt-1 text-xs text-ink-400">Check your appointments for updates.</p>
            </div>
            <div className="rounded-2xl border border-line/70 bg-surface-2/40 p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-ink-300"><Bell className="h-3.5 w-3.5" /> Notifications</div>
              <p className="mt-2 text-sm font-medium text-ink">You’ll be notified</p>
              <p className="mt-1 text-xs text-ink-400">Confirmation or changes will appear in Notifications.</p>
            </div>
            <div className="rounded-2xl border border-line/70 bg-surface-2/40 p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-ink-300"><Info className="h-3.5 w-3.5" /> Next steps</div>
              <p className="mt-2 text-sm font-medium text-ink">Review details</p>
              <p className="mt-1 text-xs text-ink-400">Open your appointment for counselor, time, and mode info.</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link to="/student/appointments">View my appointments</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/student/messages">Message counselor</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-ink-400">If you need urgent help, use Help & Crisis. MindWell is not an emergency service.</p>
        </div>
      </Card>
    </div>
  );
}
