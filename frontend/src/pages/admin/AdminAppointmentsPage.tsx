import { useEffect, useMemo, useState } from "react";
import { Card, Button } from "@/components/ui/Primitives";
import { adminUpdateAppointment, appointmentAnalytics, listAppointments, type Appointment } from "@/api/appointments";
import { adminListCounselorProfiles, adminListUsers } from "@/api/wellness";
import { errorMessage } from "@/api/client";
import { Pencil, Save, X } from "lucide-react";
import UserAvatar from "@/components/profile/UserAvatar";

type AdminUser = { id: number; fullName: string; email: string; role: string };
type CounselorProfile = { id: number; user_id: number; name: string; specialization: string | null };

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [students, setStudents] = useState<AdminUser[]>([]);
  const [counselors, setCounselors] = useState<CounselorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<{ student_user_id: string; counselor_profile_id: string }>({ student_user_id: "", counselor_profile_id: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [appts, an, usersRes, counselorProfiles] = await Promise.all([
        listAppointments(),
        appointmentAnalytics().catch(() => null),
        adminListUsers({ role: "student" }).catch(() => ({ users: [] })),
        adminListCounselorProfiles().catch(() => []),
      ]);
      setAppointments(appts as Appointment[]);
      setAnalytics(an);
      setStudents((usersRes.users ?? []) as AdminUser[]);
      setCounselors(counselorProfiles as CounselorProfile[]);
    } catch (err) {
      setError(errorMessage(err, "Could not load appointments."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const studentById = useMemo(() => new Map(students.map((s) => [Number(s.id), s])), [students]);
  const counselorByProfileId = useMemo(() => new Map(counselors.map((c) => [Number(c.id), c])), [counselors]);

  function startEdit(appt: Appointment) {
    setNotice(null);
    setError(null);
    setEditingId(appt.id);
    setDraft({ student_user_id: String(appt.student_user_id), counselor_profile_id: String(appt.counselor_profile_id) });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(id: number) {
    const studentId = Number(draft.student_user_id);
    const counselorProfileId = Number(draft.counselor_profile_id);
    if (!Number.isFinite(studentId) || studentId <= 0 || !Number.isFinite(counselorProfileId) || counselorProfileId <= 0) {
      setError("Please provide valid student user ID and counselor profile ID.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await adminUpdateAppointment(id, { student_user_id: studentId, counselor_profile_id: counselorProfileId });
      setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, ...updated } : a)));
      setEditingId(null);
      setNotice(`Appointment #${id} updated.`);
    } catch (err) {
      setError(errorMessage(err, "Could not update appointment."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {analytics ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card className="p-6"><p className="text-xs text-ink-400">Total</p><p className="mt-1 text-xl font-semibold">{analytics.total}</p></Card>
          <Card className="p-6"><p className="text-xs text-ink-400">Confirmed</p><p className="mt-1 text-xl font-semibold">{analytics.by_status?.confirmed ?? 0}</p></Card>
          <Card className="p-6"><p className="text-xs text-ink-400">Completed</p><p className="mt-1 text-xl font-semibold">{analytics.by_status?.completed ?? 0}</p></Card>
          <Card className="p-6"><p className="text-xs text-ink-400">Cancelled/Declined</p><p className="mt-1 text-xl font-semibold">{(analytics.by_status?.cancelled ?? 0) + (analytics.by_status?.declined ?? 0)}</p></Card>
        </div>
      ) : null}

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Appointments</h2>
            <p className="mt-1 text-sm text-ink-400">View appointment records and correct assigned student/counselor identities (IDs). Names shown are resolved from account records; to change a person’s name, update their account in User Management.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => void load()}>Refresh</Button>
        </div>
        {error ? <p className="px-6 pb-2 text-sm text-status-danger">{error}</p> : null}
        {notice ? <p className="px-6 pb-2 text-sm text-teal-700">{notice}</p> : null}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-navy-050">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium sm:px-6">Appt ID</th>
                <th className="px-4 py-2 text-left text-xs font-medium sm:px-6">Student</th>
                <th className="px-4 py-2 text-left text-xs font-medium sm:px-6">Counselor</th>
                <th className="px-4 py-2 text-left text-xs font-medium sm:px-6">Time</th>
                <th className="px-4 py-2 text-left text-xs font-medium sm:px-6">Status</th>
                <th className="px-4 py-2 text-right text-xs font-medium sm:px-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-6 text-ink-400">Loading appointments…</td></tr>
              ) : appointments.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-6 text-ink-400">No appointments found.</td></tr>
              ) : appointments.map((appointment) => {
                const editing = editingId === appointment.id;
                const student = studentById.get(Number(editing ? draft.student_user_id : appointment.student_user_id));
                const counselor = counselorByProfileId.get(Number(editing ? draft.counselor_profile_id : appointment.counselor_profile_id));
                return (
                  <tr key={appointment.id} className="align-top">
                    <td className="px-4 py-3 sm:px-6 font-medium">#{appointment.id}</td>
                    <td className="px-4 py-3 sm:px-6">
                      {editing ? (
                        <div className="space-y-1">
                          <select
                            value={draft.student_user_id}
                            onChange={(e) => setDraft((d) => ({ ...d, student_user_id: e.target.value }))}
                            className="h-10 w-full max-w-xs rounded-field border border-line/80 bg-white px-3 text-sm"
                          >
                            <option value="">Select student…</option>
                            {students.map((s) => (
                              <option key={s.id} value={s.id}>{s.fullName} (ID {s.id})</option>
                            ))}
                          </select>
                          <p className="text-xs text-ink-400">Student user ID: {draft.student_user_id || "—"}</p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            user={{ fullName: appointment.student_name || student?.fullName || "Student", avatarUrl: appointment.student_avatar_url ?? null }}
                            size="sm"
                          />
                          <div>
                            <p className="font-medium text-ink">{appointment.student_name || student?.fullName || "Unknown student"}</p>
                            <p className="text-xs text-ink-400">User ID: {appointment.student_user_id}{student?.email ? ` · ${student.email}` : ""}</p>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 sm:px-6">
                      {editing ? (
                        <div className="space-y-1">
                          <select
                            value={draft.counselor_profile_id}
                            onChange={(e) => setDraft((d) => ({ ...d, counselor_profile_id: e.target.value }))}
                            className="h-10 w-full max-w-xs rounded-field border border-line/80 bg-white px-3 text-sm"
                          >
                            <option value="">Select counselor…</option>
                            {counselors.map((c) => (
                              <option key={c.id} value={c.id}>{c.name} (Profile {c.id}, User {c.user_id})</option>
                            ))}
                          </select>
                          <p className="text-xs text-ink-400">Counselor profile ID: {draft.counselor_profile_id || "—"}{counselor ? ` · User ID: ${counselor.user_id}` : ""}</p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            user={{ fullName: appointment.counselor_name || counselor?.name || "Counselor", avatarUrl: appointment.counselor_avatar_url ?? null }}
                            size="sm"
                          />
                          <div>
                            <p className="font-medium text-ink">{appointment.counselor_name || counselor?.name || "Unknown counselor"}</p>
                            <p className="text-xs text-ink-400">Profile ID: {appointment.counselor_profile_id}{appointment.counselor_user_id ? ` · User ID: ${appointment.counselor_user_id}` : counselor ? ` · User ID: ${counselor.user_id}` : ""}</p>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-400 sm:px-6 whitespace-nowrap">{new Date(appointment.slot_start).toLocaleString("en-PH")}</td>
                    <td className="px-4 py-3 capitalize sm:px-6">{appointment.status}</td>
                    <td className="px-4 py-3 sm:px-6">
                      <div className="flex justify-end gap-2">
                        {editing ? (
                          <>
                            <Button size="sm" onClick={() => void saveEdit(appointment.id)} disabled={saving}><Save className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save"}</Button>
                            <Button size="sm" variant="ghost" onClick={cancelEdit} disabled={saving}><X className="h-3.5 w-3.5" /> Cancel</Button>
                          </>
                        ) : (
                          <Button size="sm" variant="secondary" onClick={() => startEdit(appointment)}><Pencil className="h-3.5 w-3.5" /> Edit IDs</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
