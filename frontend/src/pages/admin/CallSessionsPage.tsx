import { useEffect, useState } from "react";
import { Card, Badge, IconBadge } from "@/components/ui/Primitives";
import { EmptyState } from "@/components/ui/Feedback";
import { listAppointments, type Appointment } from "@/api/appointments";
import { formatDateTime } from "@/components/ui/Helpers";
import { Video, Calendar, Clock, Activity } from "lucide-react";

export default function AdminCallSessionsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listAppointments()
      .then(setAppointments)
      .finally(() => setLoading(false));
  }, []);

  const sessions = appointments.filter((a) => 
    a.mode === "online" || a.mode === "in_person"
  );

  const confirmed = sessions.filter((a) => a.status === "confirmed");
  const completed = sessions.filter((a) => a.status === "completed");
  const today = sessions.filter((a) => new Date(a.slot_start).toDateString() === new Date().toDateString());

  return (
    <div className="flex flex-col gap-6">
      <Card className="relative overflow-hidden p-6">
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-mint/20 to-teal/10 blur-3xl" />
        <div className="relative z-10 flex items-center gap-3">
          <IconBadge icon={Video} tone="teal" />
          <div>
            <h2 className="text-lg font-semibold">Call Session Monitoring</h2>
            <p className="text-sm text-ink-400">Monitor all scheduled video and audio sessions</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-ink-300">Total Sessions</p>
              <p className="mt-2 text-3xl font-semibold">{sessions.length}</p>
            </div>
            <IconBadge icon={Video} tone="teal" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-ink-300">Today</p>
              <p className="mt-2 text-3xl font-semibold">{today.length}</p>
            </div>
            <IconBadge icon={Clock} tone="sky" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-ink-300">Confirmed</p>
              <p className="mt-2 text-3xl font-semibold">{confirmed.length}</p>
            </div>
            <IconBadge icon={Calendar} tone="teal" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-ink-300">Completed</p>
              <p className="mt-2 text-3xl font-semibold">{completed.length}</p>
            </div>
            <IconBadge icon={Activity} tone="navy" />
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-line/70 px-6 py-5">
          <h3 className="text-lg font-semibold">All Sessions</h3>
          <p className="mt-1 text-sm text-ink-400">System-wide session overview</p>
        </div>
        {loading ? (
          <p className="px-6 py-10 text-sm text-ink-400">Loading sessions...</p>
        ) : sessions.length === 0 ? (
          <EmptyState
            title="No sessions found"
            description="No video or audio sessions scheduled yet."
          />
        ) : (
          <ul className="divide-y divide-line/70">
            {sessions.slice(0, 20).map((session) => (
              <li key={session.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-navy-050 to-white text-xs font-semibold text-navy">
                    {session.student_name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "S"}
                  </div>
                  <div>
                    <p className="font-medium">{session.student_name || "Student"} ↔ {session.counselor_name || "Counselor"}</p>
                    <p className="text-sm text-ink-400">{formatDateTime(session.slot_start)} • {session.mode === "online" ? "Online" : "In-Person"} • 60 min</p>
                  </div>
                </div>
                <Badge tone={session.status === "completed" ? "success" : session.status === "confirmed" ? "teal" : "neutral"}>{session.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
