import { useState } from "react";
import { Link } from "react-router";
import { forgotPassword } from "@/api/auth";
import { Button, IconInput, Label } from "@/components/ui/Primitives";
import { Alert } from "@/components/ui/Feedback";
import { errorMessage } from "@/api/client";
import { ArrowLeft, Mail, MailCheck, Send } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const result = await forgotPassword(email);
      setSent(true);
      if (result.devToken) setDevToken(result.devToken);
    } catch (err) {
      setError(errorMessage(err, "Could not request a password reset."));
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-mint-soft text-teal-600">
          <MailCheck aria-hidden="true" strokeWidth={1.8} className="h-6 w-6" />
        </div>
        <h1 className="text-heading font-semibold">Check your email</h1>
        <p className="mt-1 text-sm text-ink-400">
          If that email is registered, we sent instructions to reset your password.
        </p>
        {devToken ? (
          <Alert className="mt-4">
            <div>
              <p className="font-medium">Development token</p>
              <p className="mt-1 break-all text-xs">{devToken}</p>
              <p className="mt-1 text-xs">
                Use it on{" "}
                <Link to="/reset-password" className="underline">
                  /reset-password
                </Link>
              </p>
            </div>
          </Alert>
        ) : null}
        <Button asChild className="mt-6 w-full">
          <Link to="/signin">
            <ArrowLeft aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
            Back to sign in
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-heading font-semibold">Reset your password</h1>
      <p className="mt-1 text-sm text-ink-400">
        Enter the email associated with your account and we&apos;ll send reset
        instructions.
      </p>
      {error ? <Alert className="mt-4">{error}</Alert> : null}
      <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <IconInput
            id="email"
            icon={Mail}
            type="email"
            autoComplete="email"
            placeholder="you@school.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            "Sending…"
          ) : (
            <>
              <Send aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
              Send reset link
            </>
          )}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-400">
        <Link to="/signin" className="font-medium text-teal hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
