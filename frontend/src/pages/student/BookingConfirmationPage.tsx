import { Card, Button } from "@/components/ui/Primitives";
import { Link } from "react-router";

export default function BookingConfirmationPage() {
  return (
    <div className="mx-auto max-w-lg">
      <Card className="p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-soft">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-6 w-6 text-success"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="mt-4 text-heading font-semibold">Appointment requested</h1>
        <p className="mt-1 text-sm text-ink-400">
          Angela Reyes will confirm your session within 24 hours. You'll get a
          notification.
        </p>
        <div className="mt-6 space-y-2 text-left">
          <div className="flex justify-between rounded-field bg-navy-050 p-3 text-sm">
            <span className="text-ink-400">Counselor</span>
            <span>Angela Reyes</span>
          </div>
          <div className="flex justify-between rounded-field bg-navy-050 p-3 text-sm">
            <span className="text-ink-400">Date & Time</span>
            <span>Oct 12, 2026 • 10:00 AM</span>
          </div>
          <div className="flex justify-between rounded-field bg-navy-050 p-3 text-sm">
            <span className="text-ink-400">Mode</span>
            <span>Online</span>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link to="/student/appointments">View my appointments</Link>
          </Button>
          <Button asChild variant="secondary">
            <span>Add to calendar</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}
