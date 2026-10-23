import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { resetPassword } from "@/api/auth";
import { Button, IconInput, Label, PasswordInput } from "@/components/ui/Primitives";
import { Alert } from "@/components/ui/Feedback";
import { errorMessage } from "@/api/client";
import { ArrowLeft, CheckCircle2, KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";

export default function ResetPasswordPage() {
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(token, newPassword);
      setDone(true);
      setTimeout(() => navigate("/signin"), 1500);
    } catch (err) {
      setError(errorMessage(err, "Could not reset your password."));
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-success">
          <CheckCircle2 aria-hidden="true" strokeWidth={1.8} className="h-6 w-6" />
        </div>
        <h1 className="text-heading font-semibold">Password updated</h1>
        <p className="mt-1 text-sm text-ink-400">
          Your password has been reset. Redirecting to sign in…
        </p>
        <Button asChild className="mt-6 w-full">
          <Link to="/signin">
            <ArrowLeft aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
            Sign in now
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-heading font-semibold">Set a new password</h1>
      <p className="mt-1 text-sm text-ink-400">
        Paste the token from your email (or development console) and choose a
        new password.
      </p>
      {error ? <Alert className="mt-4">{error}</Alert> : null}
      <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="token">Reset token</Label>
          <IconInput
            id="token"
            icon={KeyRound}
            placeholder="Paste your reset token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="newPassword">New password</Label>
          <PasswordInput
            id="newPassword"
            icon={LockKeyhole}
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <PasswordInput
            id="confirmPassword"
            icon={ShieldCheck}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            "Updating…"
          ) : (
            <>
              <KeyRound aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
              Update password
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
