import { Card, Button, Badge } from "@/components/ui/Primitives";
import { Link } from "react-router";

export default function CaseDetailPage() {
  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="flex flex-col gap-6">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-mint-soft text-sm font-semibold text-navy">
                S15
              </div>
              <div>
                <h2 className="text-lg font-semibold">Student 1588</h2>
                <div className="mt-1 flex gap-2">
                  <Badge tone="success">Active</Badge>
                  <Badge tone="warning">Study pressure</Badge>
                </div>
              </div>
            </div>
            <Button asChild variant="secondary">
              <Link to="/counselor/messages">Open in messages</Link>
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-base font-semibold">Session Timeline</h3>
          <ul className="mt-4 divide-y divide-line">
            <li className="py-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">Session note filed</p>
                <span className="text-xs text-ink-400">Oct 9, 2026</span>
              </div>
              <p className="mt-1 text-sm text-ink-400">
                Follow-up session completed. Student showing improvement.
              </p>
            </li>
            <li className="py-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">First session</p>
                <span className="text-xs text-ink-400">Sep 30, 2026</span>
              </div>
              <p className="mt-1 text-sm text-ink-400">
                Initial intake completed.
              </p>
            </li>
            <li className="py-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">Request accepted</p>
                <span className="text-xs text-ink-400">Sep 28, 2026</span>
              </div>
            </li>
            <li className="py-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">Request received</p>
                <span className="text-xs text-ink-400">Sep 25, 2026</span>
              </div>
            </li>
          </ul>
        </Card>
      </div>

      <div className="flex flex-col gap-6">
        <Card className="p-6">
          <h3 className="text-base font-semibold">Next follow-up</h3>
          <p className="mt-2 text-sm">Oct 16, 2026 • 2:00 PM</p>
          <Button className="mt-4 w-full">Reschedule</Button>
        </Card>

        <Card className="p-6">
          <h3 className="text-base font-semibold">Concern</h3>
          <p className="mt-2 text-sm text-ink-600">
            Academic stress related to upcoming exams and time management.
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-base font-semibold">Risk flags</h3>
          <div className="mt-2">
            <Badge tone="success">No current flags</Badge>
          </div>
        </Card>

        <Card className="border-warning/40 bg-warning-soft p-4">
          <p className="text-xs text-warning">
            Only open records you need. Keep information confidential.
          </p>
        </Card>
      </div>
    </div>
  );
}
