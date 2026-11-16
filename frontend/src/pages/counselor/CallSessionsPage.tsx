import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Card, Button, Badge, IconBadge } from "@/components/ui/Primitives";
import { EmptyState } from "@/components/ui/Feedback";
import { listAppointments, type Appointment } from "@/api/appointments";
import { formatDateTime } from "@/components/ui/Helpers";
import { Video, Calendar, Clock, Users, Plus } from "lucide-react";

export default function CounselorCallSessionsPage() {
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

  const upcoming = sessions.filter((a) => 
    a.status === "confirmed" && new Date(a.slot_start) > new Date()
  );

  const today = sessions.filter((a) => 
    a.status === "confirmed" && new Date(a.slot_start).toDateString() === new Date().toDateString()
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
              <p className="text-sm text-ink-400">Manage and join your counseling sessions</p>
            </div>
          </div>
          <Button asChild>
            <Link to="/counselor/schedule">
              <Plus className="h-4 w-4" />
              Schedule Session
            </Link>
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
              <p className="text-xs uppercase tracking-[0.22em] text-ink-300">Upcoming</p>
              <p className="mt-2 text-3xl font-semibold">{upcoming.length}</p>
            </div>
            <IconBadge icon={Calendar} tone="teal" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-ink-300">Total</p>
              <p className="mt-2 text-3xl font-semibold">{sessions.length}</p>
            </div>
            <IconBadge icon={Users} tone="navy" />
          </div>
        </Card>
      </div>

      <section className="flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-semibold">Upcoming Sessions</h3>
          <p className="text-sm text-ink-400">Start or join your sessions</p>
        </div>
        {loading ? (
          <p className="text-sm text-ink-400">Loading sessions...</p>
        ) : upcoming.length === 0 ? (
          <EmptyState
            title="No upcoming sessions"
            description="Your scheduled sessions will appear here."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {upcoming.map((session) => (
              <Card key={session.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-mint-soft to-white text-sm font-semibold text-teal-600">
                      {session.student_name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "S"}
                    </div>
                    <div>
                      <p className="font-semibold">{session.student_name || "Student"}</p>
                      <p className="text-sm text-ink-400">{session.concern_category || "Counseling Session"}</p>
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
                <div className="mt-4 flex gap-2">
                  <Button className="flex-1">
                    <Video className="h-4 w-4" />
                    Start Session
                  </Button>
                  <Button asChild variant="secondary" className="flex-1">
                    <Link to={`/counselor/cases?student=${session.student_user_id}`}>
                      View Case
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
