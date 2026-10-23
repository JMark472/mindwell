import { Card, Button } from "@/components/ui/Primitives";
import { Link } from "react-router";

export default function HelpCrisisPage() {
  return (
    <div className="flex flex-col gap-6">
      <Card className="border-danger/40 bg-danger-soft p-6">
        <h2 className="text-lg font-semibold text-danger">In immediate danger</h2>
        <p className="mt-1 text-sm text-danger">
          If you or someone else is in immediate danger of serious harm, call
          local emergency services or go to the nearest emergency room.
        </p>
        <Button asChild variant="danger" className="mt-4">
          <a href="tel:911">Call 911</a>
        </Button>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold">Crisis hotlines (Philippines)</h2>
        <ul className="mt-4 divide-y divide-line">
          <li className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">NCMH Crisis Hotline</p>
              <p className="text-sm text-ink-400">Available 24/7</p>
            </div>
            <Button asChild variant="secondary">
              <a href="tel:1553">Call 1553</a>
            </Button>
          </li>
          <li className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">Campus Guidance &amp; Counseling Office</p>
              <p className="text-sm text-ink-400">Mon–Fri, 8:00 AM – 5:00 PM</p>
            </div>
            <Button asChild variant="secondary">
              <Link to="/student/appointments/book">Request a session</Link>
            </Button>
          </li>
        </ul>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold">Self-help</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button asChild variant="ghost">
            <Link to="/student/resources">Browse resources</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/student/check-in">Do a quick check-in</Link>
          </Button>
        </div>
        <p className="mt-4 text-xs text-ink-400">
          Mindwell is not a replacement for professional mental health care and is
          not an emergency response service.
        </p>
      </Card>
    </div>
  );
}
