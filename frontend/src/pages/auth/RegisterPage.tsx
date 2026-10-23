import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { register as apiRegister } from "@/api/auth";
import { Button, Input, Label } from "@/components/ui/Primitives";
import { Alert } from "@/components/ui/Feedback";
import { errorMessage, fieldErrors } from "@/api/client";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    studentNumber: "",
    program: "",
    yearLevel: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { setUser } = useAuth();
  const navigate = useNavigate();

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setErrors({});

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await apiRegister({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        studentNumber: form.studentNumber || undefined,
        program: form.program || undefined,
        yearLevel: form.yearLevel || undefined,
      });
      setUser(result.user);
      navigate("/student/dashboard", { replace: true });
    } catch (err) {
      setErrors(fieldErrors(err));
      setError(errorMessage(err, "Could not create your account."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-heading font-semibold">Create your account</h1>
      <p className="mt-1 text-sm text-ink-400">
        Register with your school email to access Mindwell.
      </p>
      {error ? <Alert className="mt-4">{error}</Alert> : null}
      <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            value={form.fullName}
            onChange={(e) => update("fullName", e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">School email</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            required
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="studentNumber">Student ID (optional)</Label>
            <Input
              id="studentNumber"
              value={form.studentNumber}
              onChange={(e) => update("studentNumber", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="yearLevel">Year level (optional)</Label>
            <Input
              id="yearLevel"
              value={form.yearLevel}
              onChange={(e) => update("yearLevel", e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            required
          />
          {errors.password ? (
            <p className="text-xs text-danger">{errors.password}</p>
          ) : (
            <p className="text-xs text-ink-400">
              At least 8 characters, include a letter and a number.
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={(e) => update("confirmPassword", e.target.value)}
            required
          />
        </div>
        <Button type="submit" disabled={submitting} className="mt-2">
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-400">
        Already have an account?{" "}
        <Link to="/signin" className="font-medium text-teal hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
