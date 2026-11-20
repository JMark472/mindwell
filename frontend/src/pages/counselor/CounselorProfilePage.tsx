import { useEffect, useState } from "react";
import { Card, Button, Input, Label } from "@/components/ui/Primitives";
import { Alert } from "@/components/ui/Feedback";
import { getMyCounselorProfile, updateCounselorProfile, updateAvailability, type CounselorProfile, type AvailabilityWindow } from "@/api/appointments";
import { changePassword, fetchMyProfile, updateMyProfile } from "@/api/auth";
import { errorMessage } from "@/api/client";
import ProfilePhotoUpload from "@/components/profile/ProfilePhotoUpload";
import { useAuth } from "@/context/AuthContext";

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CounselorProfilePage() {
  const { user, setUser } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMsg, setNameMsg] = useState<string | null>(null);
  const [nameErr, setNameErr] = useState<string | null>(null);
  const [profile, setProfile] = useState<CounselorProfile | null>(null);
  const [availability, setAvailability] = useState<AvailabilityWindow[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    void getMyCounselorProfile().then((result) => {
      setProfile(result.profile);
      setAvailability(result.availability);
    });
    void fetchMyProfile().then((result) => {
      setUser(result.user);
      setFullName(result.user.fullName || "");
      setPhone(result.user.phone || "");
    }).catch(() => {});
  }, [setUser]);

  useEffect(() => {
    setFullName(user?.fullName || "");
    setPhone(user?.phone || "");
  }, [user?.fullName, user?.phone]);

  async function saveProfile() {
    if (!profile) return;
    setSaving(true);
    await updateCounselorProfile(profile);
    setMessage("Profile updated.");
    setSaving(false);
    setTimeout(() => setMessage(null), 2000);
  }

  async function saveAvailability() {
    if (availability.length === 0) return;
    setSaving(true);
    await updateAvailability(availability);
    setMessage("Availability updated.");
    setSaving(false);
    setTimeout(() => setMessage(null), 2000);
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

  if (!profile) return <p className="text-sm text-ink-400">Loading…</p>;

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold">Profile Information</h2>
        <p className="mt-1 text-sm text-ink-400">Manage your account details and professional profile information.</p>
        <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
          <ProfilePhotoUpload size="lg" />
          <div className="flex-1 space-y-1.5 text-center sm:text-left">
            <p className="text-base font-semibold">{user?.fullName || "Counselor"}</p>
            <p className="text-sm text-ink-400">{user?.email || ""}</p>
            <p className="text-sm text-ink-400">Upload a photo from your device to personalize your profile. JPG, PNG, WebP, or GIF up to 5MB.</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="counselorName">Full name</Label>
            <Input
              id="counselorName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="counselorPhone">Phone</Label>
            <Input
              id="counselorPhone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
            />
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <Label htmlFor="counselorEmail">Email</Label>
            <Input id="counselorEmail" value={user?.email || ""} disabled readOnly />
          </div>
          {nameMsg ? <p className="text-xs text-teal md:col-span-2">{nameMsg}</p> : null}
          {nameErr ? <p className="text-xs text-danger md:col-span-2">{nameErr}</p> : null}
          <div className="md:col-span-2">
            <Button
              size="sm"
              className="w-fit"
              disabled={nameSaving || (fullName === (user?.fullName || "") && phone === (user?.phone || ""))}
              onClick={async () => {
                setNameSaving(true);
                setNameMsg(null);
                setNameErr(null);
                try {
                  const res = await updateMyProfile({ fullName, phone });
                  setUser(res.user);
                  setNameMsg("Profile information updated.");
                } catch (err) {
                  setNameErr(errorMessage(err, "Could not update profile information."));
                } finally {
                  setNameSaving(false);
                }
              }}
            >
              {nameSaving ? "Saving…" : "Update profile information"}
            </Button>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Specialization</span>
            <input
              value={profile.specialization ?? ""}
              onChange={(e) => setProfile({ ...profile, specialization: e.target.value })}
              className="h-10 rounded-field border border-line px-3 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Credentials</span>
            <input
              value={profile.credentials ?? ""}
              onChange={(e) => setProfile({ ...profile, credentials: e.target.value })}
              className="h-10 rounded-field border border-line px-3 text-sm"
            />
          </label>
        </div>
        <label className="mt-4 flex flex-col gap-1.5">
          <span className="text-sm font-medium">Bio</span>
          <textarea
            value={profile.bio ?? ""}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            rows={4}
            className="rounded-field border border-line px-3 py-2 text-sm"
          />
        </label>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={profile.accepting_students}
            onChange={(e) => setProfile({ ...profile, accepting_students: e.target.checked })}
          />
          Accepting new students
        </label>
        <Button className="mt-4" disabled={saving} onClick={() => void saveProfile()}>
          Save profile
        </Button>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold">Weekly availability</h2>
        <p className="mt-1 text-sm text-ink-400">
          Set the time windows you&apos;re available for sessions.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          {[1, 2, 3, 4, 5].map((day) => {
            const existing = availability.find((a) => a.day_of_week === day);
            return (
              <div key={day} className="flex flex-wrap items-center gap-3 rounded-field border border-line p-3">
                <span className="w-10 text-sm font-medium">{days[day]}</span>
                <input
                  aria-label={`${days[day]} start time`}
                  type="time"
                  value={existing?.start_time ?? "09:00"}
                  onChange={(e) => {
                    const next = availability.filter((a) => a.day_of_week !== day);
                    next.push({ day_of_week: day, start_time: e.target.value, end_time: existing?.end_time ?? "12:00" });
                    setAvailability(next);
                  }}
                  className="h-9 rounded-field border border-line px-2 text-sm"
                />
                <span className="text-sm text-ink-400">to</span>
                <input
                  aria-label={`${days[day]} end time`}
                  type="time"
                  value={existing?.end_time ?? "12:00"}
                  onChange={(e) => {
                    const next = availability.filter((a) => a.day_of_week !== day);
                    next.push({ day_of_week: day, start_time: existing?.start_time ?? "09:00", end_time: e.target.value });
                    setAvailability(next);
                  }}
                  className="h-9 rounded-field border border-line px-2 text-sm"
                />
              </div>
            );
          })}
        </div>
        <Button className="mt-4" disabled={saving} onClick={() => void saveAvailability()}>
          Save availability
        </Button>
        {message ? <p className="mt-2 text-sm text-teal">{message}</p> : null}
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
