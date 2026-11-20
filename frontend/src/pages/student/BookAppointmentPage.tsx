import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Card, Button } from "@/components/ui/Primitives";
import { listCounselors, listSlots, bookAppointment, type CounselorSummary, type Slot } from "@/api/appointments";
import { errorMessage } from "@/api/client";
import UserAvatar from "@/components/profile/UserAvatar";

const categories = ["Academic stress", "Exam anxiety", "Family concerns", "Relationships", "Other"];

export default function BookAppointmentPage() {
  const [counselors, setCounselors] = useState<CounselorSummary[]>([]);
  const [selectedCounselor, setSelectedCounselor] = useState<number | null>(null);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [mode, setMode] = useState<"online" | "in_person">("online");
  const [category, setCategory] = useState(categories[0]);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    listCounselors().then(setCounselors).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedCounselor) return;
    listSlots(selectedCounselor, date)
      .then(setSlots)
      .catch(() => setSlots([]));
  }, [selectedCounselor, date]);

  async function book() {
    if (!selectedCounselor || !selectedSlot) return;
    setSubmitting(true);
    setError(null);
    try {
      await bookAppointment({
        counselor_profile_id: selectedCounselor,
        slot_start: selectedSlot,
        mode,
        concern_category: category,
        student_note: note.trim() || undefined,
      });
      navigate("/student/appointments/confirmation");
    } catch (err) {
      setError(errorMessage(err, "Could not book this appointment."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Book a counseling session</h2>
          <p className="mt-1 text-sm text-ink-400">
            Choose a counselor, pick an available time, and share a brief concern. Your counselor will confirm your request.
          </p>
        </div>
        <Button asChild variant="secondary" className="w-full justify-center sm:w-auto">
          <Link to="/student/appointments">View my appointments</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Card className="p-5 sm:p-6">
          <h3 className="text-base font-semibold">1) Choose a counselor</h3>
          <p className="mt-1 text-sm text-ink-400">Select a counselor to see available time slots.</p>
          {counselors.length === 0 ? (
            <p className="mt-4 rounded-field border border-dashed border-line bg-surface-2/40 px-4 py-6 text-center text-sm text-ink-400">
              No counselors are available right now. Please check back later.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-line/80">
              {counselors.map((counselor) => (
                <li key={counselor.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCounselor(counselor.id);
                      setSelectedSlot(null);
                    }}
                    className={`flex min-h-14 w-full items-center justify-between gap-2 rounded-xl px-2 py-3 text-left transition-colors sm:gap-3 sm:px-3 ${
                      selectedCounselor === counselor.id
                        ? "bg-mint-soft/50 text-navy"
                        : "text-ink hover:bg-navy-050/60"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <UserAvatar
                        user={{ fullName: counselor.name, avatarUrl: counselor.avatar_url ?? null }}
                        size="md"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{counselor.name}</p>
                        <p className="truncate text-sm text-ink-400">{counselor.specialization}</p>
                      </div>
                    </div>
                    {selectedCounselor === counselor.id ? (
                      <span className="shrink-0 rounded-pill bg-teal/10 px-2.5 py-1 text-xs font-medium text-teal-700">Selected</span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5 sm:p-6">
          <h3 className="text-base font-semibold">2) Pick a date and time</h3>
          <label className="mt-3 flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink-600">Preferred date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setSelectedSlot(null);
              }}
              disabled={!selectedCounselor}
              className="min-h-11 w-full min-w-0 rounded-field border border-line/80 bg-surface/95 px-3 text-base text-ink focus-visible:border-teal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/10 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm sm:w-auto"
            />
          </label>
          <div className="mt-4">
            <p className="text-sm font-medium text-ink-600">Available slots</p>
            {!selectedCounselor ? (
              <p className="mt-2 text-sm text-ink-400">Choose a counselor first to view available slots.</p>
            ) : slots.filter((slot) => slot.available).length === 0 ? (
              <p className="mt-2 rounded-field border border-dashed border-line bg-surface-2/40 px-4 py-4 text-sm text-ink-400">
                No open slots on this day. Try another date.
              </p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {slots
                  .filter((slot) => slot.available)
                  .map((slot) => (
                    <button
                      key={slot.start}
                      type="button"
                      onClick={() => setSelectedSlot(slot.start)}
                      className={`min-h-11 rounded-field border px-3.5 py-2 text-sm font-medium transition-colors ${
                        selectedSlot === slot.start
                          ? "border-teal bg-mint-soft text-teal-700"
                          : "border-line/80 bg-white text-ink-600 hover:border-teal/40 hover:bg-navy-050"
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))}
              </div>
            )}
          </div>

          <h3 className="mt-6 text-base font-semibold">3) Session details</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink-600">Session mode</span>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as "online" | "in_person")}
                className="min-h-11 w-full min-w-0 rounded-field border border-line/80 bg-surface/95 px-3 text-base text-ink focus-visible:border-teal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/10 sm:text-sm"
              >
                <option value="online">Online</option>
                <option value="in_person">In-person</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink-600">Concern category</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="min-h-11 w-full min-w-0 rounded-field border border-line/80 bg-surface/95 px-3 text-base text-ink focus-visible:border-teal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/10 sm:text-sm"
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="mt-3 flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink-600">Notes for counselor (optional)</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              placeholder="Share anything you'd like your counselor to know ahead of time."
              className="w-full min-w-0 rounded-field border border-line/80 bg-surface/95 px-3.5 py-2.5 text-base text-ink placeholder:text-ink-400 focus-visible:border-teal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/10 sm:text-sm"
            />
          </label>
          {error ? <p className="mt-3 break-words text-sm text-danger">{error}</p> : null}
          <Button
            className="mt-4 w-full justify-center sm:w-auto"
            disabled={!selectedCounselor || !selectedSlot || submitting}
            onClick={() => void book()}
          >
            {submitting ? "Requesting..." : "Request appointment"}
          </Button>
          <p className="mt-2 text-xs text-ink-400">
            You can review your request status in My Appointments after submitting.
          </p>
        </Card>
      </div>
    </div>
  );
}