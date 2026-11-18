import { useEffect, useState } from "react";
import { Card, Button } from "@/components/ui/Primitives";
import { getAppointment, cancelAppointment, type Appointment } from "@/api/appointments";
import { useParams, useNavigate } from "react-router";
import { formatDateTime } from "@/components/ui/Helpers";
import { errorMessage } from "@/api/client";
import UserAvatar from "@/components/profile/UserAvatar";

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

  if (!appointment) return <Card className="p-6"><p className="text-sm text-ink-400">Loading appointment details…</p></Card>;

  const statusTone = appointment.status === "confirmed" ? "success" : appointment.status === "completed" ? "info" : appointment.status === "pending" ? "warning" : "danger";

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden">
        <div className="border-b border-line/70 px-6 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <UserAvatar
                user={{ fullName: appointment.counselor_name ?? "Counselor", avatarUrl: appointment.counselor_avatar_url ?? null }}
                size="lg"
              />
              <div>
                <h2 className="text-lg font-semibold">{appointment.counselor_name ?? "Counselor"}</h2>
                <p className="text-sm text-ink-400">Guidance Counselor • Appointment details and session information</p>
              </div>
            </div>
            <span className={`inline-flex rounded-pill px-3 py-1 text-xs font-medium capitalize ${statusTone === "success" ? "bg-success-soft text-success" : statusTone === "info" ? "bg-info-soft text-info" : statusTone === "warning" ? "bg-warning-soft text-warning" : "bg-danger-soft text-danger"}`}>
              {appointment.status}
            </span>
          </div>
        </div>
        <div className="p-6">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-line/70 bg-surface-2/40 p-4">
              <dt className="text-xs uppercase tracking-[0.16em] text-ink-300">Date</dt>
              <dd className="mt-1 text-sm font-medium">{formatDateTime(appointment.slot_start).split(" at ")[0]}</dd>
            </div>
            <div className="rounded-2xl border border-line/70 bg-surface-2/40 p-4">
              <dt className="text-xs uppercase tracking-[0.16em] text-ink-300">Time</dt>
              <dd className="mt-1 text-sm font-medium">{formatDateTime(appointment.slot_start).split(" at ")[1] || "—"}</dd>
            </div>
            <div className="rounded-2xl border border-line/70 bg-surface-2/40 p-4">
              <dt className="text-xs uppercase tracking-[0.16em] text-ink-300">Mode</dt>
              <dd className="mt-1 text-sm font-medium capitalize">{appointment.mode.replace("_", " • ")}</dd>
            </div>
            <div className="rounded-2xl border border-line/70 bg-surface-2/40 p-4">
              <dt className="text-xs uppercase tracking-[0.16em] text-ink-300">Duration</dt>
              <dd className="mt-1 text-sm font-medium">50 minutes (estimated)</dd>
            </div>
            <div className="rounded-2xl border border-line/70 bg-surface-2/40 p-4 sm:col-span-2">
              <dt className="text-xs uppercase tracking-[0.16em] text-ink-300">Concern category</dt>
              <dd className="mt-1 text-sm font-medium">{appointment.concern_category ?? "—"}</dd>
            </div>
            <div className="rounded-2xl border border-line/70 bg-surface-2/40 p-4 sm:col-span-2">
              <dt className="text-xs uppercase tracking-[0.16em] text-ink-300">Notes for counselor</dt>
              <dd className="mt-1 text-sm text-ink-600">{appointment.student_note || "No notes provided."}</dd>
            </div>
            <div className="rounded-2xl border border-line/70 bg-surface-2/40 p-4 sm:col-span-2">
              <dt className="text-xs uppercase tracking-[0.16em] text-ink-300">Counselor note</dt>
              <dd className="mt-1 text-sm text-ink-600">{appointment.counselor_note || "No counselor note yet."}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-ink-400">If you need to make changes, use the available actions below (when applicable) or contact your counselor through Messages.</p>
        </div>
      </Card>

      {(appointment.status === "pending" || appointment.status === "confirmed") ? (
        <Card className="p-5">
          <h3 className="font-semibold">Manage appointment</h3>
          <p className="mt-1 text-sm text-ink-400">You can request changes or cancel if you can’t attend. Your counselor will be notified of cancellations.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary">Reschedule</Button>
            <Button variant="ghost" className="text-danger" onClick={() => setShowCancel(true)}>
              Cancel appointment
            </Button>
          </div>
        </Card>
      ) : null}

      {showCancel ? (
        <Card className="p-6">
          <h3 className="text-base font-semibold">Cancel this appointment?</h3>
          <p className="mt-1 text-sm text-ink-400">
            Your counselor will be notified. This action cannot be undone.
          </p>
          <label className="mt-4 flex flex-col gap-1.5">
            <span className="text-sm font-medium">Reason for cancellation (optional)</span>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-10 rounded-field border border-line px-3 text-sm"
              placeholder="Share a short reason if you'd like"
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
