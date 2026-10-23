import { useEffect, useState } from "react";
import { Card, Button } from "@/components/ui/Primitives";
import { getAppointment, cancelAppointment, type Appointment } from "@/api/appointments";
import { useParams, useNavigate } from "react-router";
import { formatDateTime } from "@/components/ui/Helpers";
import { errorMessage } from "@/api/client";

export default function StudentAppointmentDetailPage() {
  const { id } = useParams();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCancel, setShowCancel] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    getAppointment(Number(id))
      .then(setAppointment)
      .catch(() => {});
  }, [id]);

  async function cancel() {
    if (!appointment) return;
    setSubmitting(true);
    setError(null);
    try {
      await cancelAppointment(appointment.id, reason);
      navigate("/student/appointments");
    } catch (err) {
      setError(errorMessage(err, "Could not cancel this appointment."));
    } finally {
      setSubmitting(false);
    }
  }

  if (!appointment) return <p className="text-sm text-ink-400">Loading…</p>;

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-mint-soft text-sm font-semibold text-navy">
              AR
            </div>
            <div>
              <h2 className="text-lg font-semibold">{appointment.counselor_name ?? "Angela Reyes"}</h2>
              <p className="text-sm text-ink-400">Guidance Counselor</p>
            </div>
          </div>
          <span className="rounded-pill bg-navy-050 px-2 py-0.5 text-xs capitalize">
            {appointment.status}
          </span>
        </div>
        <dl className="mt-6 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-ink-400">Date</dt>
            <dd className="text-sm">{formatDateTime(appointment.slot_start).split(" at ")[0]}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-400">Time</dt>
            <dd className="text-sm">{formatDateTime(appointment.slot_start).split(" at ")[1]}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-400">Mode</dt>
            <dd className="text-sm capitalize">{appointment.mode.replace("_", " • ")}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-400">Duration</dt>
            <dd className="text-sm">50 minutes</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-ink-400">Reason</dt>
            <dd className="text-sm">{appointment.concern_category ?? "—"}</dd>
          </div>
          {appointment.student_note ? (
            <div className="sm:col-span-2">
              <dt className="text-xs text-ink-400">Notes for counselor</dt>
              <dd className="text-sm">{appointment.student_note}</dd>
            </div>
          ) : null}
          {appointment.counselor_note ? (
            <div className="sm:col-span-2">
              <dt className="text-xs text-ink-400">Counselor note</dt>
              <dd className="text-sm">{appointment.counselor_note}</dd>
            </div>
          ) : null}
        </dl>
      </Card>

      {(appointment.status === "pending" || appointment.status === "confirmed") ? (
        <div className="flex gap-2">
          <Button variant="secondary">Reschedule</Button>
          <Button variant="ghost" className="text-danger" onClick={() => setShowCancel(true)}>
            Cancel appointment
          </Button>
        </div>
      ) : null}

      {showCancel ? (
        <Card className="p-6">
          <h3 className="text-base font-semibold">Cancel this appointment?</h3>
          <p className="mt-1 text-sm text-ink-400">
            Your counselor will be notified. This cannot be undone.
          </p>
          <label className="mt-4 flex flex-col gap-1.5">
            <span className="text-sm font-medium">Reason for cancellation (optional)</span>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-10 rounded-field border border-line px-3 text-sm"
            />
          </label>
          {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
          <div className="mt-4 flex gap-2">
            <Button variant="secondary" onClick={() => setShowCancel(false)}>
              Keep it
            </Button>
            <Button variant="danger" disabled={submitting} onClick={() => void cancel()}>
              {submitting ? "Cancelling…" : "Cancel appointment"}
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
