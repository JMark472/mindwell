import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Card, Button, Badge, IconBadge } from "@/components/ui/Primitives";
import { EmptyState } from "@/components/ui/Feedback";
import { listAppointments, type Appointment } from "@/api/appointments";
import { formatDateTime } from "@/components/ui/Helpers";
import { Video, Calendar, Clock } from "lucide-react";
import InPageCall, { type InPageCallInfo } from "@/components/ui/InPageCall";
import { useAuth } from "@/context/AuthContext";

export default function CallSessionsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCall, setActiveCall] = useState<InPageCallInfo | null>(null);

  useEffect(() => {
    listAppointments()
      .then(setAppointments)
      .finally(() => setLoading(false));
  }, []);

  const sessions = appointments.filter((a) => 
    a.mode === "online" || a.mode === "in_person"
  );

  const upcoming = sessions.filter((a) => 
    a.status === "confirmed" && new Date(a.slot_start) > new Date()
  );

  const past = sessions.filter((a) => 
    a.status === "completed" || new Date(a.slot_start) < new Date()
  );

  return (
    <div className="flex flex-col gap-6">
      <Card className="relative overflow-hidden p-6">
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-mint/20 to-teal/10 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <IconBadge icon={Video} tone="teal" />
            <div>
              <h2 className="text-lg font-semibold">Call Sessions</h2>
              <p className="text-sm text-ink-400">Join your scheduled video or audio counseling sessions</p>
            </div>
          </div>
          <Button asChild>
            <Link to="/student/appointments/book">
              <Calendar className="h-4 w-4" />
              Book New Session
            </Link>
          </Button>
        </div>
      </Card>

      <section className="flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-semibold">Upcoming Sessions</h3>
          <p className="text-sm text-ink-400">Sessions ready to join</p>
        </div>
        {loading ? (
          <p className="text-sm text-ink-400">Loading sessions...</p>
        ) : upcoming.length === 0 ? (
          <EmptyState
            title="No upcoming sessions"
            description="Book a video or audio session with a counselor."
            action={<Button asChild><Link to="/student/appointments/book">Book a Session</Link></Button>}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {upcoming.map((session) => (
              <Card key={session.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-navy-050 to-white text-sm font-semibold text-navy">
                      {session.counselor_name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "C"}
                    </div>
                    <div>
                      <p className="font-semibold">{session.counselor_name || "Counselor"}</p>
                      <p className="text-sm text-ink-400">Counseling Session</p>
                    </div>
                  </div>
                  <Badge tone="teal">{session.mode || "video"}</Badge>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-ink-600">
                    <Calendar className="h-4 w-4" />
                    {formatDateTime(session.slot_start)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-ink-600">
                    <Clock className="h-4 w-4" />
                    Duration: 60 min
                  </div>
                </div>
                <Button
                  className="mt-4 w-full"
                  onClick={() => {
                    const room = `Mindwell-Appointment-${session.id}`;
                    setActiveCall({
                      room,
                      video: true,
                      name: session.counselor_name || "Counseling session",
                    });
                  }}
                >
                  <Video className="h-4 w-4" />
                  Join Session
                </Button>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-semibold">Session History</h3>
          <p className="text-sm text-ink-400">Past sessions</p>
        </div>
        {past.length === 0 ? (
          <EmptyState
            title="No past sessions"
            description="Your completed sessions will appear here."
          />
        ) : (
          <Card className="overflow-hidden">
            <ul className="divide-y divide-line">
              {past.map((session) => (
                <li key={session.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold text-ink-600">
                      {session.counselor_name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "C"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium">{session.counselor_name || "Counselor"}</p>
                      <p className="text-sm text-ink-400">{formatDateTime(session.slot_start)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <Badge tone={session.status === "completed" ? "success" : "neutral"}>{session.status}</Badge>
                    <Button asChild variant="ghost" size="sm">
                      <Link to={`/student/appointments/${session.id}`}>View Details</Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>

      {activeCall ? (
        <InPageCall
          call={activeCall}
          displayName={user?.fullName || "Mindwell User"}
          onClose={() => setActiveCall(null)}
        />
      ) : null}
    </div>
  );
}
