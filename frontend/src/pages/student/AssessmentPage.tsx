import { useState } from "react";
import { Card, Button } from "@/components/ui/Primitives";
import { useNavigate } from "react-router";

const questions = [
  {
    id: 1,
    question: "In the past 2 weeks, how often have you felt nervous, anxious, or on edge?",
    options: [
      { value: 0, label: "Not at all" },
      { value: 1, label: "Several days" },
      { value: 2, label: "More than half the days" },
      { value: 3, label: "Nearly every day" },
    ],
  },
  {
    id: 2,
    question: "In the past 2 weeks, how often have you not been able to stop or control worrying?",
    options: [
      { value: 0, label: "Not at all" },
      { value: 1, label: "Several days" },
      { value: 2, label: "More than half the days" },
      { value: 3, label: "Nearly every day" },
    ],
  },
  {
    id: 3,
    question: "In the past 2 weeks, how often have you had trouble relaxing?",
    options: [
      { value: 0, label: "Not at all" },
      { value: 1, label: "Several days" },
      { value: 2, label: "More than half the days" },
      { value: 3, label: "Nearly every day" },
    ],
  },
];

export default function AssessmentPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const navigate = useNavigate();

  function selectAnswer(value: number) {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = value;
    setAnswers(newAnswers);
  }

  function next() {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      navigate("/student/assessment-results");
    }
  }

  function previous() {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="mx-auto max-w-2xl flex flex-col gap-6">
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-ink-300">Self-assessment</p>
            <h2 className="mt-2 text-xl font-semibold">Wellbeing check-in questionnaire</h2>
            <p className="mt-1 text-sm text-ink-400">Answer based on how you’ve felt recently. This is for reflection and support guidance, not a medical diagnosis.</p>
          </div>
          <div className="rounded-2xl border border-line/70 bg-surface-2/40 px-4 py-3 text-sm">
            <p className="text-xs text-ink-400">Progress</p>
            <p className="font-semibold text-ink">Question {currentQuestion + 1} of {questions.length}</p>
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-ink-400">Completion</span>
            <span className="font-medium text-ink">{Math.round(progress)}%</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-surface-2">
            <div
              className="h-2.5 rounded-full bg-gradient-to-r from-teal to-mint transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <h3 className="mt-6 text-lg font-semibold leading-relaxed">{questions[currentQuestion].question}</h3>

        <div className="mt-6 flex flex-col gap-2.5">
          {questions[currentQuestion].options.map((option) => (
            <button
              key={option.value}
              onClick={() => selectAnswer(option.value)}
              className={`rounded-2xl border p-4 text-left transition-all duration-200 ${
                answers[currentQuestion] === option.value
                  ? "border-teal/50 bg-mint-soft ring-2 ring-teal/10 shadow-card"
                  : "border-line/80 bg-white/80 hover:-translate-y-0.5 hover:border-teal/30 hover:bg-white hover:shadow-card"
              }`}
            >
              <span className="font-medium text-ink">{option.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button variant="secondary" onClick={previous} disabled={currentQuestion === 0}>
            Previous
          </Button>
          <Button onClick={next} disabled={answers[currentQuestion] === undefined}>
            {currentQuestion === questions.length - 1 ? "View results" : "Next"}
          </Button>
        </div>
        <p className="mt-4 text-xs text-ink-400">Your responses can help you reflect and decide on next steps, such as self-care resources or talking with a counselor.</p>
      </Card>
    </div>
  );
}
