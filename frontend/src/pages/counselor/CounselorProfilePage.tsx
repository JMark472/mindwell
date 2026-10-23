import { useEffect, useState } from "react";
import { Card, Button } from "@/components/ui/Primitives";
import { getMyCounselorProfile, updateCounselorProfile, updateAvailability, type CounselorProfile, type AvailabilityWindow } from "@/api/appointments";

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CounselorProfilePage() {
  const [profile, setProfile] = useState<CounselorProfile | null>(null);
  const [availability, setAvailability] = useState<AvailabilityWindow[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void getMyCounselorProfile().then((result) => {
      setProfile(result.profile);
      setAvailability(result.availability);
    });
  }, []);

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

  if (!profile) return <p className="text-sm text-ink-400">Loading…</p>;

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold">Counselor profile</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
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
    </div>
  );
}
