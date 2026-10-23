import { Card, Button, IconBadge } from "@/components/ui/Primitives";
import { Link } from "react-router";
import {
  BookOpen,
  CalendarPlus,
  HeartPulse,
  Phone,
  PhoneCall,
  Siren,
} from "lucide-react";

export default function HelpCrisisPage() {
  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col gap-3 border-danger/40 bg-danger-soft p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <IconBadge icon={Siren} tone="danger" className="bg-white/70" />
          <div>
            <h2 className="text-lg font-semibold text-danger">In immediate danger</h2>
            <p className="mt-1 text-sm text-danger">
              If you or someone else is in immediate danger of serious harm, call
              local emergency services or go to the nearest emergency room.
            </p>
          </div>
        </div>
        <Button asChild variant="danger">
          <a href="tel:911">
            <PhoneCall aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
            Call 911
          </a>
        </Button>
      </Card>

      <Card className="p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Phone aria-hidden="true" strokeWidth={1.8} className="h-5 w-5 text-teal" />
          Crisis hotlines (Philippines)
        </h2>
        <ul className="mt-4 divide-y divide-line">
          <li className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">NCMH Crisis Hotline</p>
              <p className="text-sm text-ink-400">Available 24/7</p>
            </div>
            <Button asChild variant="secondary">
              <a href="tel:1553">
                <PhoneCall aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
                Call 1553
              </a>
            </Button>
          </li>
          <li className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">Campus Guidance &amp; Counseling Office</p>
              <p className="text-sm text-ink-400">Mon–Fri, 8:00 AM – 5:00 PM</p>
            </div>
            <Button asChild variant="secondary">
              <Link to="/student/appointments/book">
                <CalendarPlus aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
                Request a session
              </Link>
            </Button>
          </li>
        </ul>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold">Self-help</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button asChild variant="ghost">
            <Link to="/student/resources">
              <BookOpen aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
              Browse resources
            </Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/student/check-in">
              <HeartPulse aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
              Do a quick check-in
            </Link>
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
