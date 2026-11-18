import { Card, Button, IconBadge, Badge } from "@/components/ui/Primitives";
import { Link } from "react-router";
import {
  BookOpen,
  CalendarPlus,
  HeartPulse,
  Phone,
  PhoneCall,
  Siren,
  ShieldAlert,
  MessageCircleHeart,
  Info,
} from "lucide-react";

export default function HelpCrisisPage() {
  return (
    <div className="flex flex-col gap-6">
      <Card className="relative flex flex-col gap-4 overflow-hidden border-danger/30 !bg-none bg-gradient-to-r from-danger-soft via-white to-white p-6 md:flex-row md:items-center md:justify-between">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-danger/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-danger/70 to-danger/30" />
        <div className="relative z-10 flex items-start gap-4">
          <IconBadge icon={Siren} tone="danger" className="bg-white/80 ring-1 ring-danger/20" />
          <div>
            <Badge tone="danger" className="mb-2">Immediate danger</Badge>
            <h2 className="text-lg font-semibold text-danger">If you need urgent help right now</h2>
            <p className="mt-1 max-w-2xl text-sm text-ink-600">
              If you or someone else is in immediate danger of serious harm, call local emergency services or go to the nearest emergency room immediately.
            </p>
            <p className="mt-2 text-xs text-ink-500">MindWell can support your wellbeing, but it is not an emergency response service.</p>
          </div>
        </div>
        <Button asChild variant="danger" className="relative z-10 shrink-0">
          <a href="tel:911">
            <PhoneCall aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
            Call 911
          </a>
        </Button>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="overflow-hidden">
          <div className="border-b border-line/70 px-6 py-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Phone aria-hidden="true" strokeWidth={1.8} className="h-5 w-5 text-teal" />
              Crisis and support contacts (Philippines)
            </h2>
            <p className="mt-1 text-sm text-ink-400">Reach out to trained responders or request professional support through your campus services.</p>
          </div>
          <ul className="divide-y divide-line/70">
            <li className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">NCMH Crisis Hotline</p>
                <p className="text-sm text-ink-400">24/7 confidential mental health support</p>
                <p className="mt-1 text-xs text-ink-400">Call if you feel overwhelmed, unsafe, or need someone to talk to urgently.</p>
              </div>
              <Button asChild variant="secondary" className="shrink-0">
                <a href="tel:1553">
                  <PhoneCall aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
                  Call 1553
                </a>
              </Button>
            </li>
            <li className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">Campus Guidance &amp; Counseling Office</p>
                <p className="text-sm text-ink-400">Mon–Fri, 8:00 AM – 5:00 PM (schedule may vary)</p>
                <p className="mt-1 text-xs text-ink-400">Book a session with a counselor for non-emergency support and follow-up care.</p>
              </div>
              <Button asChild variant="secondary" className="shrink-0">
                <Link to="/student/appointments/book">
                  <CalendarPlus aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
                  Request a session
                </Link>
              </Button>
            </li>
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold"><ShieldAlert className="h-5 w-5 text-teal" /> What you can do now</h2>
          <ul className="mt-4 space-y-3 text-sm text-ink-600">
            <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-teal" />Move to a safe place if possible and stay with someone you trust.</li>
            <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-teal" />Contact emergency services or a crisis hotline for immediate help.</li>
            <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-teal" />If it’s not an emergency, reach out to a counselor or a trusted person.</li>
            <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-teal" />Use grounding or self-care tools to help you feel steadier while getting support.</li>
          </ul>
          <div className="mt-5 rounded-2xl border border-line/70 bg-surface-2/50 p-4 text-xs text-ink-500">
            <div className="flex items-start gap-2"><Info className="mt-0.5 h-4 w-4 text-teal" /><p>If you’re supporting someone else, listen calmly, stay with them if safe, and help them contact professional or emergency services.</p></div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold"><MessageCircleHeart className="h-5 w-5 text-teal" /> Self-help and next steps</h2>
        <p className="mt-1 text-sm text-ink-400">Explore calming resources or check in with yourself while arranging support.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild variant="secondary">
            <Link to="/student/resources">
              <BookOpen aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
              Browse resources
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/student/check-in">
              <HeartPulse aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
              Do a quick check-in
            </Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/student/messages">
              Message a counselor
            </Link>
          </Button>
        </div>
        <p className="mt-5 rounded-xl border border-warning/30 bg-warning-soft/60 p-3 text-xs text-ink-600">
          MindWell is not a replacement for professional mental health care and is not an emergency response service.
        </p>
      </Card>
    </div>
  );
}
