import { Card, Button, Badge, IconBadge } from "@/components/ui/Primitives";
import { Link } from "react-router";
import { Activity, BookOpen, CalendarPlus, HeartPulse, Info, Sparkles } from "lucide-react";

export default function AssessmentResultsPage() {
  return (
    <div className="flex flex-col gap-6">
      <Card className="relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-warning/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 left-10 h-40 w-40 rounded-full bg-teal/10 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Badge tone="info" className="mb-2">Sample result view</Badge>
            <h2 className="text-xl font-semibold">Assessment results</h2>
            <p className="mt-1 text-sm text-ink-400">This page shows an example results layout. Scores and insights should reflect your latest completed assessment when available.</p>
          </div>
          <Badge tone="warning">Moderate stress (example)</Badge>
        </div>
        <div className="relative z-10 mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-line/70 bg-white/80 p-5 text-center">
            <p className="text-xs uppercase tracking-[0.18em] text-ink-300">Example score</p>
            <p className="mt-2 text-4xl font-semibold text-ink">24 / 42</p>
            <p className="mt-1 text-sm text-ink-400">Stress score</p>
          </div>
          <div className="rounded-2xl border border-line/70 bg-white/80 p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-ink"><Activity className="h-4 w-4 text-teal" /> What it indicates</div>
            <p className="mt-2 text-sm text-ink-500">Responses may suggest moderate stress that could affect daily wellbeing and focus.</p>
          </div>
          <div className="rounded-2xl border border-line/70 bg-white/80 p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-ink"><Sparkles className="h-4 w-4 text-teal" /> Suggested next step</div>
            <p className="mt-2 text-sm text-ink-500">Try coping tools, track your mood, or speak with a counselor for support.</p>
          </div>
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <h3 className="text-base font-semibold">What this means</h3>
        <div className="mt-3 space-y-2 text-sm text-ink-600">
          <p>Assessment results can help you notice patterns in stress, mood, or wellbeing over time.</p>
          <p>Moderate stress is common among students. Small, consistent steps and support can make a meaningful difference.</p>
          <div className="mt-3 rounded-2xl border border-warning/30 bg-warning-soft/60 p-3 text-xs text-ink-600">
            <div className="flex items-start gap-2"><Info className="mt-0.5 h-4 w-4 text-warning" /><p>This assessment is for informational and self-reflection purposes only and is not a substitute for professional diagnosis or emergency care.</p></div>
          </div>
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <h3 className="text-base font-semibold">Recommendations</h3>
        <p className="mt-1 text-sm text-ink-400">Choose a next step that feels manageable right now.</p>
        <div className="mt-4 grid gap-3">
          <div className="flex flex-col gap-3 rounded-2xl border border-line/70 bg-surface-2/40 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3"><IconBadge icon={BookOpen} tone="teal" /><div><p className="font-medium">Try a grounding exercise</p><p className="text-sm text-ink-400">Use a short calming technique for immediate relief and focus.</p></div></div>
            <Button asChild variant="ghost" size="sm" className="min-h-11 w-full justify-center sm:min-h-9 sm:w-auto"><Link to="/student/resources">Explore resources</Link></Button>
          </div>
          <div className="flex flex-col gap-3 rounded-2xl border border-line/70 bg-surface-2/40 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3"><IconBadge icon={CalendarPlus} tone="navy" /><div><p className="font-medium">Book a counseling session</p><p className="text-sm text-ink-400">Speak with a counselor for personalized support and guidance.</p></div></div>
            <Button asChild size="sm" className="min-h-11 w-full justify-center sm:min-h-9 sm:w-auto"><Link to="/student/appointments/book">Book now</Link></Button>
          </div>
          <div className="flex flex-col gap-3 rounded-2xl border border-line/70 bg-surface-2/40 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3"><IconBadge icon={HeartPulse} tone="mint" /><div><p className="font-medium">Track your mood this week</p><p className="text-sm text-ink-400">Daily check-ins can help you notice patterns, triggers, and progress.</p></div></div>
            <Button asChild variant="secondary" size="sm" className="min-h-11 w-full justify-center sm:min-h-9 sm:w-auto"><Link to="/student/check-in">Start check-in</Link></Button>
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button asChild className="w-full justify-center sm:w-auto"><Link to="/student/appointments/book">Book counseling</Link></Button>
        <Button asChild variant="secondary" className="w-full justify-center sm:w-auto"><Link to="/student/assessment">Retake assessment</Link></Button>
        <Button asChild variant="ghost" className="w-full justify-center sm:w-auto"><Link to="/student/messages">Discuss with counselor</Link></Button>
      </div>
    </div>
  );
}
