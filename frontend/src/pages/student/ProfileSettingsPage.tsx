import { useEffect, useState } from "react";
import { fetchMyProfile, updateMyProfile } from "@/api/auth";
import { getConsents, updateConsent } from "@/api/wellness";
import { Card, Button, Input, Label } from "@/components/ui/Primitives";
import { Alert } from "@/components/ui/Feedback";
import { useAuth } from "@/context/AuthContext";
import { errorMessage } from "@/api/client";

export default function ProfileSettingsPage() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    fullName: user?.fullName ?? "",
    phone: user?.phone ?? "",
    studentNumber: "",
    program: "",
    yearLevel: "",
  });
  const [consents, setConsents] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchMyProfile().then((result) => {
      setUser(result.user);
      setForm((prev) => ({
        ...prev,
        fullName: result.user.fullName,
        phone: result.user.phone ?? "",
        studentNumber: (result.profile?.studentNumber as string) ?? "",
        program: (result.profile?.program as string) ?? "",
        yearLevel: (result.profile?.yearLevel as string) ?? "",
      }));
    });
    void getConsents().then((result) => {
      const state: Record<string, boolean> = {};
      for (const [key, value] of Object.entries(result.consents)) {
        state[key] = value.granted;
      }
      setConsents(state);
    });
  }, [setUser]);

  async function save() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const result = await updateMyProfile(form);
      setUser(result.user);
      setMessage("Profile updated.");
    } catch (err) {
      setError(errorMessage(err, "Could not update profile."));
    } finally {
      setSaving(false);
    }
  }

  async function toggle(type: string, granted: boolean) {
    try {
      await updateConsent(type, granted, "v1");
      setConsents((prev) => ({ ...prev, [type]: granted }));
    } catch (err) {
      setError(errorMessage(err, "Could not update consent."));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold">Profile</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              value={form.fullName}
              onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="studentNumber">Student ID</Label>
            <Input
              id="studentNumber"
              value={form.studentNumber}
              onChange={(e) => setForm((prev) => ({ ...prev, studentNumber: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="program">Program</Label>
            <Input
              id="program"
              value={form.program}
              onChange={(e) => setForm((prev) => ({ ...prev, program: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="yearLevel">Year level</Label>
            <Input
              id="yearLevel"
              value={form.yearLevel}
              onChange={(e) => setForm((prev) => ({ ...prev, yearLevel: e.target.value }))}
            />
          </div>
        </div>
        {message ? <Alert tone="success" className="mt-4">{message}</Alert> : null}
        {error ? <Alert className="mt-4">{error}</Alert> : null}
        <Button className="mt-4" disabled={saving} onClick={() => void save()}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold">Privacy &amp; consent</h2>
        <p className="mt-1 text-sm text-ink-400">
          You control when a counselor can see your wellness check-ins.
        </p>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={consents.checkin_sharing ?? false}
            onChange={(e) => void toggle("checkin_sharing", e.target.checked)}
          />
          Allow sharing of check-ins with my assigned counselor
        </label>
      </Card>
    </div>
  );
}
