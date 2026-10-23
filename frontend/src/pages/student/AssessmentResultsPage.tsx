import { Card, Button, Badge } from "@/components/ui/Primitives";
import { Link } from "react-router";

export default function AssessmentResultsPage() {
  return (
    <div className="flex flex-col gap-6">
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">Assessment Results</h2>
            <p className="mt-1 text-sm text-ink-400">Last taken: Oct 8, 2026</p>
          </div>
          <Badge tone="warning">Moderate stress detected</Badge>
        </div>
        <div className="mt-6 text-center">
          <p className="text-4xl font-semibold">24 / 42</p>
          <p className="mt-1 text-sm text-ink-400">Stress Score</p>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-base font-semibold">What this means</h3>
        <div className="mt-3 space-y-2 text-sm text-ink-600">
          <p>
            Your responses suggest moderate levels of stress that may be affecting
            your daily life and wellbeing.
          </p>
          <p>
            While this is a common experience for students, it's important to
            take steps to manage your stress and seek support when needed.
          </p>
          <p>
            This assessment is for informational purposes only and is not a
            substitute for professional diagnosis.
          </p>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-base font-semibold">Recommendations</h3>
        <div className="mt-4 grid gap-3">
          <div className="flex items-center justify-between rounded-field bg-navy-050 p-4">
            <div>
              <p className="font-medium">Try a grounding exercise</p>
              <p className="text-sm text-ink-400">
                Practice 5-4-3-2-1 technique for immediate relief
              </p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/student/resources">Try now</Link>
            </Button>
          </div>
          <div className="flex items-center justify-between rounded-field bg-navy-050 p-4">
            <div>
              <p className="font-medium">Book a counseling session</p>
              <p className="text-sm text-ink-400">
                Speak with a trained counselor for personalized support
              </p>
            </div>
            <Button asChild size="sm">
              <Link to="/student/appointments/book">Book now</Link>
            </Button>
          </div>
          <div className="flex items-center justify-between rounded-field bg-navy-050 p-4">
            <div>
              <p className="font-medium">Track your mood this week</p>
              <p className="text-sm text-ink-400">
                Daily check-ins help identify patterns and triggers
              </p>
            </div>
            <Button asChild variant="secondary" size="sm">
              <Link to="/student/check-in">Check in</Link>
            </Button>
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button asChild>
          <Link to="/student/appointments/book">Book counseling</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link to="/student/assessment">Retake in 7 days</Link>
        </Button>
        <Button asChild variant="ghost">
          <span>Share results with my counselor</span>
        </Button>
      </div>
    </div>
  );
}
