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
    <div className="mx-auto max-w-2xl">
      <Card className="p-6">
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-ink-400">
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <span className="text-ink-400">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-surface-2">
            <div
              className="h-2 rounded-full bg-teal transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <h2 className="text-lg font-semibold">{questions[currentQuestion].question}</h2>

        <div className="mt-6 flex flex-col gap-2">
          {questions[currentQuestion].options.map((option) => (
            <button
              key={option.value}
              onClick={() => selectAnswer(option.value)}
              className={`rounded-field border p-4 text-left transition-colors ${
                answers[currentQuestion] === option.value
                  ? "border-teal bg-mint-soft"
                  : "border-line hover:bg-navy-050"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-6 flex justify-between">
          <Button variant="secondary" onClick={previous} disabled={currentQuestion === 0}>
            Previous
          </Button>
          <Button onClick={next} disabled={answers[currentQuestion] === undefined}>
            {currentQuestion === questions.length - 1 ? "Submit" : "Next"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
