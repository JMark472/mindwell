import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "@/context/AuthContext";
import { Button, IconInput, Label, PasswordInput } from "@/components/ui/Primitives";
import { Alert } from "@/components/ui/Feedback";
import { errorMessage } from "@/api/client";
import { LockKeyhole, LogIn, Mail } from "lucide-react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setLocalError(null);
    try {
      const user = await login(email, password);
      const from = (location.state as { from?: { pathname: string } } | null)?.from
        ?.pathname;
      if (from) {
        navigate(from, { replace: true });
        return;
      }
      if (user.role === "admin") navigate("/admin/dashboard", { replace: true });
      else if (user.role === "counselor") navigate("/counselor/dashboard", { replace: true });
      else navigate("/student/dashboard", { replace: true });
    } catch (err) {
      setLocalError(errorMessage(err, "Unable to sign in. Check your details and try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-heading font-semibold">Sign in to Mindwell</h1>
      <p className="mt-1 text-sm text-ink-400">
        Use your school account to access your wellness portal.
      </p>
      {(localError || error) ? <Alert className="mt-4">{localError || error}</Alert> : null}
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
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            icon={LockKeyhole}
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="flex items-center justify-between text-sm">
          <Link to="/forgot-password" className="font-medium text-teal hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" disabled={submitting} className="mt-2">
          {submitting ? (
            "Signing in…"
          ) : (
            <>
              <LogIn aria-hidden="true" strokeWidth={1.8} className="h-4 w-4" />
              Sign in
            </>
          )}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-400">
        New to Mindwell?{" "}
        <Link to="/register" className="font-medium text-teal hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
