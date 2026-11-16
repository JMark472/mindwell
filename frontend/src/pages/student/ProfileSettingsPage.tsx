import { useEffect, useState } from "react";
import { fetchMyProfile, updateMyProfile, changePassword } from "@/api/auth";
import { getConsents, updateConsent } from "@/api/wellness";
import { Card, Button, Input, Label } from "@/components/ui/Primitives";
import { Alert } from "@/components/ui/Feedback";
import { useAuth } from "@/context/AuthContext";
import { errorMessage } from "@/api/client";
import ProfilePhotoUpload from "@/components/profile/ProfilePhotoUpload";

export default function ProfileSettingsPage() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    fullName: user?.fullName ?? "",
    phone: user?.phone ?? "",
    avatarUrl: user?.avatarUrl ?? "",
    studentNumber: "",
    program: "",
    yearLevel: "",
  });
  const [consents, setConsents] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    void fetchMyProfile().then((result) => {
      setUser(result.user);
      setForm((prev) => ({
        ...prev,
        fullName: result.user.fullName,
        phone: result.user.phone ?? "",
        avatarUrl: result.user.avatarUrl ?? "",
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
    const studentNumber = form.studentNumber.trim();
    const yearLevel = form.yearLevel.trim();
    if (!studentNumber || !yearLevel) {
      setSaving(false);
      setError("Student ID and Year level are required.");
      return;
    }
    try {
      const result = await updateMyProfile({
        ...form,
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        avatarUrl: form.avatarUrl.trim(),
        studentNumber,
        program: form.program.trim(),
        yearLevel,
      });
      setUser(result.user);
      setMessage("Profile updated.");
    } catch (err) {
      setError(errorMessage(err, "Could not update profile."));
    } finally {
      setSaving(false);
    }
  }

  function handleAvatarChange(avatarUrl: string | null) {
    setForm((prev) => ({ ...prev, avatarUrl: avatarUrl ?? "" }));
    setMessage("Profile photo updated.");
    setError(null);
  }

  async function toggle(type: string, granted: boolean) {
    try {
      await updateConsent(type, granted, "v1");
      setConsents((prev) => ({ ...prev, [type]: granted }));
    } catch (err) {
      setError(errorMessage(err, "Could not update consent."));
    }
  }

  async function handleChangePassword() {
    setPasswordMessage(null);
    setPasswordError(null);
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordError("Please fill in all password fields.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (!/[a-zA-Z]/.test(passwordForm.newPassword) || !/[0-9]/.test(passwordForm.newPassword)) {
      setPasswordError("Password must contain at least one letter and one number.");
      return;
    }
    setChangingPassword(true);
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordMessage("Password changed successfully.");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPasswordError(errorMessage(err, "Could not change password."));
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold">Profile</h2>
        <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
          <ProfilePhotoUpload size="lg" onChange={handleAvatarChange} />
          <div className="flex-1 space-y-1.5 text-center sm:text-left">
            <p className="text-base font-semibold">{form.fullName || user?.fullName || "Your name"}</p>
            <p className="text-sm text-ink-400">Upload a photo from your device to personalize your profile. JPG, PNG, WebP, or GIF up to 5MB.</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              value={form.fullName}
              onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
              placeholder="Enter your full name"
            />
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <Label htmlFor="avatarUrl">Profile photo URL (optional)</Label>
            <Input
              id="avatarUrl"
              placeholder="https://example.com/your-photo.jpg"
              value={form.avatarUrl}
              onChange={(e) => setForm((prev) => ({ ...prev, avatarUrl: e.target.value }))}
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
              placeholder="e.g. 2026-00001"
              required
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
              placeholder="e.g. 2nd year"
              required
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

      <Card className="p-6">
        <h2 className="text-lg font-semibold">Change Password</h2>
        <p className="mt-1 text-sm text-ink-400">
          Update your password to keep your account secure.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-ink-400">Password must be at least 8 characters with letters and numbers.</p>
        {passwordMessage ? <Alert tone="success" className="mt-4">{passwordMessage}</Alert> : null}
        {passwordError ? <Alert className="mt-4">{passwordError}</Alert> : null}
        <Button className="mt-4" disabled={changingPassword} onClick={() => void handleChangePassword()}>
          {changingPassword ? "Changing…" : "Change Password"}
        </Button>
      </Card>
    </div>
  );
}
