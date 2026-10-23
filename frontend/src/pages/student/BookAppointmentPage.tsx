import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Card, Button } from "@/components/ui/Primitives";
import { listCounselors, listSlots, bookAppointment, type CounselorSummary, type Slot } from "@/api/appointments";
import { errorMessage } from "@/api/client";

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Book a counseling session</h2>
          <p className="text-sm text-ink-400">
            Request a slot — your counselor will confirm within 24 hours.
          </p>
        </div>
        <Button asChild variant="ghost">
          <Link to="/student/appointments">View my appointments</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Card className="p-6">
          <h3 className="text-base font-semibold">1) Choose a counselor</h3>
          <ul className="mt-3 divide-y divide-line">
            {counselors.map((counselor) => (
              <li key={counselor.id}>
                <button
                  onClick={() => setSelectedCounselor(counselor.id)}
                  className={`flex w-full items-center justify-between px-1 py-3 text-left ${
                    selectedCounselor === counselor.id ? "text-navy" : "text-ink"
                  }`}
                >
                  <div>
                    <p className="font-medium">{counselor.name}</p>
                    <p className="text-sm text-ink-400">{counselor.specialization}</p>
                  </div>
                  {selectedCounselor === counselor.id ? (
                    <span className="text-sm text-teal">Selected</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <h3 className="text-base font-semibold">2) Pick a time</h3>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-3 h-10 rounded-field border border-line px-3 text-sm"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {slots
              .filter((slot) => slot.available)
              .map((slot) => (
                <button
                  key={slot.start}
                  onClick={() => setSelectedSlot(slot.start)}
                  className={`rounded-field border px-3 py-2 text-sm ${
                    selectedSlot === slot.start
                      ? "border-teal bg-mint-soft"
                      : "border-line"
                  }`}
                >
                  {slot.label}
                </button>
              ))}
          </div>
          {slots.filter((slot) => slot.available).length === 0 ? (
            <p className="mt-3 text-sm text-ink-400">No open slots on this day.</p>
          ) : null}

          <h3 className="mt-6 text-base font-semibold">3) Details</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Mode</span>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as "online" | "in_person")}
                className="h-10 rounded-field border border-line px-3 text-sm"
              >
                <option value="online">Online</option>
                <option value="in_person">In-person</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Concern category</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-10 rounded-field border border-line px-3 text-sm"
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
            <span className="text-sm font-medium">Notes for counselor (optional)</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="rounded-field border border-line px-3 py-2 text-sm"
            />
          </label>
          {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
          <Button
            className="mt-4"
            disabled={!selectedCounselor || !selectedSlot || submitting}
            onClick={() => void book()}
          >
            {submitting ? "Requesting…" : "Request appointment"}
          </Button>
        </Card>
      </div>
    </div>
  );
}
