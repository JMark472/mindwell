import { useState } from "react";
import { Link } from "react-router";
import { Button, Input } from "@/components/ui/Primitives";
import { Alert } from "@/components/ui/Feedback";

export default function VerifyEmailPage() {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateCode(index: number, value: string) {
    if (value.length > 1) value = value.slice(0, 1);
    const next = [...code];
    next[index] = value;
    setCode(next);
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setTimeout(() => {
      setSubmitting(false);
      // In real implementation, verify code
    }, 1000);
  }

  return (
    <div>
      <h1 className="text-heading font-semibold">Check your email</h1>
      <p className="mt-1 text-sm text-ink-400">
        We sent a 6-digit code to name@cpc.edu.ph.
      </p>
      {error ? <Alert className="mt-4">{error}</Alert> : null}
      <form className="mt-6 flex flex-col gap-6" onSubmit={handleSubmit}>
        <div className="flex justify-center gap-2">
          {code.map((digit, index) => (
            <Input
              key={index}
              id={`code-${index}`}
              value={digit}
              onChange={(e) => updateCode(index, e.target.value)}
              className="h-14 w-12 text-center text-lg font-semibold"
              maxLength={1}
              inputMode="numeric"
            />
          ))}
        </div>
        <Button type="submit" disabled={submitting || code.some(c => !c)}>
          {submitting ? "Verifying…" : "Verify email"}
        </Button>
      </form>
      <div className="mt-6 flex flex-col items-center gap-2 text-sm">
        <p className="text-ink-400">Resend code in 00:42</p>
        <Link to="#" className="font-medium text-teal hover:underline">
          Change email address
        </Link>
        <Link to="/signin" className="text-ink-400 hover:underline">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
