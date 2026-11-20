import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Card, Button, Badge, IconBadge } from "@/components/ui/Primitives";
import { listAppointments, type Appointment } from "@/api/appointments";
import { errorMessage } from "@/api/client";
import UserAvatar from "@/components/profile/UserAvatar";
import Modal from "@/components/ui/Modal";
import {
  Video,
  Calendar,
  Clock,
  CheckCircle2,
  Search,
  Filter,
  X,
  Eye,
  UserRound,
  ShieldCheck,
  Activity,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ArrowUpDown,
  MonitorSmartphone,
  Phone,
} from "lucide-react";

type StatusFilter = "all" | "upcoming" | "active" | "completed" | "pending" | "cancelled";
type SortKey = "newest" | "oldest" | "appointment_date" | "status";

const PAGE_SIZE = 10;

function isActiveNow(appt: Appointment, now: number) {
  if (appt.status !== "confirmed") return false;
  const start = new Date(appt.slot_start).getTime();
  const end = new Date(appt.slot_end).getTime();
  return now >= start && now <= end;
}

function isUpcoming(appt: Appointment, now: number) {
  return appt.status === "confirmed" && new Date(appt.slot_start).getTime() > now;
}

function getDisplayStatus(appt: Appointment, now: number): "confirmed" | "pending" | "in_progress" | "completed" | "cancelled" | "declined" {
  if (isActiveNow(appt, now)) return "in_progress";
  return appt.status;
}

function statusBadgeTone(status: string) {
  if (status === "completed") return "teal" as const;
  if (status === "confirmed") return "success" as const;
  if (status === "pending") return "warning" as const;
  if (status === "in_progress") return "info" as const;
  if (status === "cancelled" || status === "declined") return "danger" as const;
  return "neutral" as const;
}

function statusLabel(status: string) {
  if (status === "in_progress") return "In Progress";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function sessionTypeLabel(mode?: string) {
  if (mode === "online") return "Video / Audio";
  if (mode === "in_person") return "In person";
  return "Session";
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { dateStyle: "medium" });
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString(undefined, { timeStyle: "short" });
}

export default function AdminCallSessionsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "online" | "in_person">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [counselorFilter, setCounselorFilter] = useState("all");
  const [studentFilter, setStudentFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [page, setPage] = useState(1);
  const [detailsAppt, setDetailsAppt] = useState<Appointment | null>(null);
  const [detailsSnapshot, setDetailsSnapshot] = useState<Appointment | null>(null);

  function openDetails(appt: Appointment) {
    setDetailsSnapshot(appt);
    setDetailsAppt(appt);
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await listAppointments();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(errorMessage(err, "Unable to load counseling session records."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    // Keep active-session counts reasonably current without disrupting the UI.
    const timer = window.setInterval(() => {
      void listAppointments()
        .then((data) => {
          if (Array.isArray(data)) setAppointments(data);
        })
        .catch(() => {
          // Ignore background refresh failures; the manual retry remains available.
        });
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const now = Date.now();

  const sessions = useMemo(
    () => appointments.filter((a) => a.mode === "online" || a.mode === "in_person"),
    [appointments],
  );

  const stats = useMemo(() => {
    const total = sessions.length;
    const upcoming = sessions.filter((a) => isUpcoming(a, now)).length;
    const active = sessions.filter((a) => isActiveNow(a, now)).length;
    const completed = sessions.filter((a) => a.status === "completed").length;
    const pending = sessions.filter((a) => a.status === "pending").length;
    const cancelled = sessions.filter((a) => a.status === "cancelled" || a.status === "declined").length;
    return { total, upcoming, active, completed, pending, cancelled };
  }, [sessions, now]);

  const counselorOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of sessions) {
      const key = String(s.counselor_user_id ?? s.counselor_profile_id ?? s.counselor_name ?? "unknown");
      const label = s.counselor_name || `Counselor #${s.counselor_profile_id}`;
      if (!map.has(key)) map.set(key, label);
    }
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [sessions]);

  const studentOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of sessions) {
      const key = String(s.student_user_id);
      const label = s.student_name || `Student #${s.student_user_id}`;
      if (!map.has(key)) map.set(key, label);
    }
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [sessions]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const fromTime = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
    const toTime = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : null;

    return sessions.filter((s) => {
      const displayStatus = getDisplayStatus(s, now);

      if (q) {
        const hay = [
          String(s.id),
          s.student_name || "",
          s.counselor_name || "",
          String(s.student_user_id),
          String(s.counselor_profile_id),
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }

      if (statusFilter === "upcoming" && !isUpcoming(s, now)) return false;
      if (statusFilter === "active" && !isActiveNow(s, now)) return false;
      if (statusFilter === "completed" && s.status !== "completed") return false;
      if (statusFilter === "pending" && s.status !== "pending") return false;
      if (statusFilter === "cancelled" && !(s.status === "cancelled" || s.status === "declined")) return false;
      if (statusFilter === "all" && displayStatus) {
        // no-op, include all statuses
      }

      if (typeFilter !== "all" && s.mode !== typeFilter) return false;

      const start = new Date(s.slot_start).getTime();
      if (fromTime !== null && start < fromTime) return false;
      if (toTime !== null && start > toTime) return false;

      if (counselorFilter !== "all") {
        const cKey = String(s.counselor_user_id ?? s.counselor_profile_id ?? s.counselor_name ?? "unknown");
        if (cKey !== counselorFilter) return false;
      }
      if (studentFilter !== "all" && String(s.student_user_id) !== studentFilter) return false;

      return true;
    });
  }, [sessions, search, statusFilter, typeFilter, dateFrom, dateTo, counselorFilter, studentFilter, now]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const statusRank: Record<string, number> = {
      in_progress: 0,
      confirmed: 1,
      pending: 2,
      completed: 3,
      cancelled: 4,
      declined: 5,
    };
    arr.sort((a, b) => {
      if (sortBy === "newest") return +new Date(b.slot_start) - +new Date(a.slot_start);
      if (sortBy === "oldest") return +new Date(a.slot_start) - +new Date(b.slot_start);
      if (sortBy === "appointment_date") return +new Date(a.slot_start) - +new Date(b.slot_start);
      const sa = getDisplayStatus(a, now);
      const sb = getDisplayStatus(b, now);
      return (statusRank[sa] ?? 99) - (statusRank[sb] ?? 99) || +new Date(b.slot_start) - +new Date(a.slot_start);
    });
    return arr;
  }, [filtered, sortBy, now]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sorted.slice(start, start + PAGE_SIZE);
  }, [sorted, currentPage]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, typeFilter, dateFrom, dateTo, counselorFilter, studentFilter, sortBy]);

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const hasActiveFilters =
    !!search.trim() ||
    statusFilter !== "all" ||
    typeFilter !== "all" ||
    !!dateFrom ||
    !!dateTo ||
    counselorFilter !== "all" ||
    studentFilter !== "all" ||
    sortBy !== "newest";

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setTypeFilter("all");
    setDateFrom("");
    setDateTo("");
    setCounselorFilter("all");
    setStudentFilter("all");
    setSortBy("newest");
    setPage(1);
  }

  const statusFilterOptions: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "All Sessions" },
    { value: "upcoming", label: "Upcoming" },
    { value: "active", label: "Active" },
    { value: "completed", label: "Completed" },
    { value: "pending", label: "Pending" },
    { value: "cancelled", label: "Cancelled" },
  ];

  return (
    <div className="flex flex-col gap-6 text-[#183B3A]">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[24px] border border-[#D7ECE6] bg-gradient-to-br from-[#E8F7F3] via-[#F3FBF8] to-[#DFF5EE] p-5 shadow-[0_18px_40px_-28px_rgba(13,148,136,0.35)] sm:p-7 lg:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#14B8A6]/15 blur-3xl sm:h-56 sm:w-56" />
        <div className="pointer-events-none absolute -bottom-14 left-8 h-44 w-44 rounded-full bg-[#0D9488]/10 blur-3xl sm:h-60 sm:w-60" />
        <div className="pointer-events-none absolute right-4 top-4 hidden gap-2 text-[#0D9488]/15 sm:flex">
          <Video className="h-7 w-7" />
          <Phone className="h-7 w-7" />
          <ShieldCheck className="h-7 w-7" />
          <MonitorSmartphone className="h-7 w-7" />
        </div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#BFE7DD] bg-white/80 px-3 py-1 text-xs font-semibold tracking-wide text-[#0D9488] shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5" />
            SYSTEM OVERVIEW
          </div>
          <h2 className="mt-4 text-2xl font-semibold leading-tight tracking-tight text-[#183B3A] sm:text-3xl lg:text-[2rem]">
            Counseling Session Management
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#64748B] sm:text-base">
            Monitor scheduled audio and video counseling sessions across the platform, including today's activity, status, and participation.
          </p>
        </div>
      </section>

      {/* Error state */}
      {error ? (
        <Card className="border-red-200 bg-red-50 p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3 text-red-700">
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 ring-1 ring-red-200">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Unable to Load Sessions</h3>
                <p className="mt-1 text-sm text-red-700/90">Something went wrong while retrieving counseling session records. Please try again.</p>
                <p className="mt-1 text-xs text-red-700/80">{error}</p>
              </div>
            </div>
            <Button onClick={() => void load()} className="bg-primary-dark text-white hover:bg-primary-deep">
              <RotateCcw className="h-4 w-4" /> Retry
            </Button>
          </div>
        </Card>
      ) : null}

      {/* Statistics */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          <>
            {[0, 1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse border-[#E2E8F0] bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-2/3 rounded bg-slate-100" />
                    <div className="h-8 w-1/2 rounded bg-slate-100" />
                    <div className="h-3 w-1/2 rounded bg-slate-100" />
                  </div>
                  <div className="h-11 w-11 rounded-xl bg-slate-100" />
                </div>
              </Card>
            ))}
          </>
        ) : (
          <>
            <Card className="border-[#E2E8F0] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#64748B]">Total Sessions</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-[#183B3A]">{stats.total}</p>
                  <p className="mt-1 text-xs text-[#64748B]">All counseling sessions</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F7F3] text-[#0D9488] ring-1 ring-[#BFE7DD]">
                  <Calendar className="h-5 w-5" />
                </div>
              </div>
            </Card>
            <Card className="border-[#E2E8F0] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#64748B]">Upcoming Sessions</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-[#183B3A]">{stats.upcoming}</p>
                  <p className="mt-1 text-xs text-[#64748B]">Confirmed future appointments</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
            </Card>
            <Card className="border-[#E2E8F0] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#64748B]">Active Sessions</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-[#183B3A]">{stats.active}</p>
                  <p className="mt-1 text-xs text-[#64748B]">In progress now (by schedule)</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600 ring-1 ring-sky-100">
                  <Video className="h-5 w-5" />
                </div>
              </div>
            </Card>
            <Card className="border-[#E2E8F0] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#64748B]">Completed Sessions</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-[#183B3A]">{stats.completed}</p>
                  <p className="mt-1 text-xs text-[#64748B]">Completed counseling sessions</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-[#0D9488] ring-1 ring-teal-100">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </div>
            </Card>
          </>
        )}
      </section>

      {!loading && !error ? (
        <div className="flex flex-wrap gap-2 text-xs text-[#64748B]">
          <span className="rounded-full border border-[#E2E8F0] bg-white px-3 py-1">Pending: <span className="font-medium text-[#183B3A]">{stats.pending}</span></span>
          <span className="rounded-full border border-[#E2E8F0] bg-white px-3 py-1">Cancelled/Declined: <span className="font-medium text-[#183B3A]">{stats.cancelled}</span></span>
        </div>
      ) : null}

      {/* Filters & Table */}
      <Card className="overflow-hidden border-[#E2E8F0] bg-white shadow-sm">
        <div className="border-b border-[#E2E8F0] px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[#183B3A]">All Counseling Sessions</h3>
              <p className="mt-1 text-sm text-[#64748B]">Monitor, review, and manage counseling sessions across the platform.</p>
            </div>
            <div className="text-sm text-[#64748B]">
              Showing <span className="font-medium text-[#183B3A]">{sorted.length}</span> matching record{sorted.length === 1 ? "" : "s"}
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_repeat(3,minmax(0,1fr))]">
            <div className="relative lg:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by student name, counselor name, or session ID"
                className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-white pl-9 pr-3 text-sm text-[#183B3A] placeholder:text-[#94A3B8] focus:border-[#0D9488] focus:outline-none focus:ring-4 focus:ring-[#0D9488]/10"
                aria-label="Search sessions"
              />
            </div>
            <div className="relative">
              <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-white pl-9 pr-3 text-sm text-[#183B3A] focus:border-[#0D9488] focus:outline-none focus:ring-4 focus:ring-[#0D9488]/10"
                aria-label="Sort sessions"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="appointment_date">Appointment date</option>
                <option value="status">Session status</option>
              </select>
            </div>
            <div className="flex items-center justify-end">
              {hasActiveFilters ? (
                <Button variant="secondary" className="w-full border-[#E2E8F0] bg-white text-[#183B3A] hover:bg-[#F5FAF9] sm:w-auto" onClick={clearFilters}>
                  <X className="h-4 w-4" /> Clear Filters
                </Button>
              ) : (
                <div className="hidden h-11 items-center gap-2 text-sm text-[#64748B] lg:flex">
                  <Filter className="h-4 w-4" /> Filters
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {statusFilterOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatusFilter(opt.value)}
                className={`inline-flex min-h-11 items-center justify-center rounded-full border px-3 py-2 text-sm transition-colors ${
                  statusFilter === opt.value
                    ? "border-[#0D9488] bg-[#E8F7F3] text-[#115E59]"
                    : "border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F5FAF9] hover:text-[#183B3A]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label htmlFor="mw-session-type" className="mb-1 block text-xs font-medium text-[#64748B]">Session Type</label>
              <select id="mw-session-type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)} className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#183B3A] focus:border-[#0D9488] focus:outline-none focus:ring-4 focus:ring-[#0D9488]/10">
                <option value="all">All (Audio / Video / In person)</option>
                <option value="online">Online (Video / Audio)</option>
                <option value="in_person">In person</option>
              </select>
            </div>
            <div>
              <label htmlFor="mw-date-from" className="mb-1 block text-xs font-medium text-[#64748B]">Date from</label>
              <input id="mw-date-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#183B3A] focus:border-[#0D9488] focus:outline-none focus:ring-4 focus:ring-[#0D9488]/10" />
            </div>
            <div>
              <label htmlFor="mw-date-to" className="mb-1 block text-xs font-medium text-[#64748B]">Date to</label>
              <input id="mw-date-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#183B3A] focus:border-[#0D9488] focus:outline-none focus:ring-4 focus:ring-[#0D9488]/10" />
            </div>
            <div>
              <label htmlFor="mw-counselor-filter" className="mb-1 block text-xs font-medium text-[#64748B]">Counselor</label>
              <select id="mw-counselor-filter" value={counselorFilter} onChange={(e) => setCounselorFilter(e.target.value)} className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#183B3A] focus:border-[#0D9488] focus:outline-none focus:ring-4 focus:ring-[#0D9488]/10">
                <option value="all">All counselors</option>
                {counselorOptions.map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="mw-student-filter" className="mb-1 block text-xs font-medium text-[#64748B]">Student</label>
              <select id="mw-student-filter" value={studentFilter} onChange={(e) => setStudentFilter(e.target.value)} className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm text-[#183B3A] focus:border-[#0D9488] focus:outline-none focus:ring-4 focus:ring-[#0D9488]/10">
                <option value="all">All students</option>
                {studentOptions.map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table / states */}
        {loading ? (
          <div className="p-4 sm:p-6">
            <div className="space-y-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl border border-[#E2E8F0] bg-slate-50" />
              ))}
            </div>
          </div>
        ) : error ? null : sorted.length === 0 ? (
          <div className="p-6 sm:p-10">
            <div className="mx-auto flex max-w-lg flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F7F3] text-[#0D9488] ring-1 ring-[#BFE7DD]">
                <Calendar className="h-7 w-7" />
              </div>
              <h4 className="mt-4 text-lg font-semibold text-[#183B3A]">No Counseling Sessions Found</h4>
              <p className="mt-2 text-sm leading-relaxed text-[#64748B]">
                {hasActiveFilters
                  ? "No sessions match your current search or filters. Try adjusting or clearing them."
                  : "Counseling session records will appear here when appointments are scheduled."}
              </p>
              {hasActiveFilters ? (
                <Button variant="secondary" className="mt-5 border-[#E2E8F0] bg-white text-[#183B3A] hover:bg-[#F5FAF9]" onClick={clearFilters}>
                  <X className="h-4 w-4" /> Clear Filters
                </Button>
              ) : null}
            </div>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-[1100px] w-full text-left text-sm">
                <thead className="bg-[#F5FAF9] text-[#64748B]">
                  <tr>
                    <th className="px-4 py-3 font-medium sm:px-6">Session ID</th>
                    <th className="px-4 py-3 font-medium sm:px-6">Student</th>
                    <th className="px-4 py-3 font-medium sm:px-6">Counselor</th>
                    <th className="px-4 py-3 font-medium sm:px-6">Appointment Date</th>
                    <th className="px-4 py-3 font-medium sm:px-6">Appointment Time</th>
                    <th className="px-4 py-3 font-medium sm:px-6">Session Type</th>
                    <th className="px-4 py-3 font-medium sm:px-6">Session Status</th>
                    <th className="px-4 py-3 font-medium sm:px-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {paged.map((session) => {
                    const displayStatus = getDisplayStatus(session, now);
                    return (
                      <tr key={session.id} className="align-top transition-colors hover:bg-[#F5FAF9]/70">
                        <td className="px-4 py-4 font-semibold text-[#183B3A] sm:px-6">#{session.id}</td>
                        <td className="px-4 py-4 sm:px-6">
                          <div className="flex min-w-[220px] items-center gap-3">
                            <UserAvatar
                              user={{ fullName: session.student_name || "Student", avatarUrl: session.student_avatar_url ?? null }}
                              size="md"
                              className="ring-1 ring-[#E2E8F0]"
                            />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-[#183B3A]">{session.student_name || "Student"}</p>
                              <p className="text-xs text-[#64748B]">Student ID: {session.student_user_id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 sm:px-6">
                          <div className="flex min-w-[220px] items-center gap-3">
                            <UserAvatar
                              user={{ fullName: session.counselor_name || "Counselor", avatarUrl: session.counselor_avatar_url ?? null }}
                              size="md"
                              className="ring-1 ring-[#E2E8F0]"
                            />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-[#183B3A]">{session.counselor_name || "Counselor"}</p>
                              <p className="text-xs text-[#64748B]">Profile ID: {session.counselor_profile_id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-[#183B3A] sm:px-6 whitespace-nowrap">{formatDate(session.slot_start)}</td>
                        <td className="px-4 py-4 text-[#183B3A] sm:px-6 whitespace-nowrap">{formatTime(session.slot_start)}</td>
                        <td className="px-4 py-4 sm:px-6">
                          <span className="inline-flex items-center gap-1.5 text-[#183B3A]">
                            {session.mode === "online" ? <Video className="h-4 w-4 text-[#0D9488]" /> : <UserRound className="h-4 w-4 text-[#0D9488]" />}
                            {sessionTypeLabel(session.mode)}
                          </span>
                        </td>
                        <td className="px-4 py-4 sm:px-6">
                          <Badge tone={statusBadgeTone(displayStatus)} className="capitalize">
                            {statusLabel(displayStatus)}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 sm:px-6">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="border-[#E2E8F0] bg-white text-[#183B3A] hover:bg-[#F5FAF9]"
                              onClick={() => openDetails(session)}
                            >
                              <Eye className="h-4 w-4" /> View Details
                            </Button>
                            <Button asChild size="sm" variant="ghost" className="border border-[#E2E8F0] bg-white text-[#183B3A] hover:bg-[#F5FAF9]">
                              <Link to="/admin/users"><UserRound className="h-4 w-4" /> Student Profile</Link>
                            </Button>
                            <Button asChild size="sm" variant="ghost" className="border border-[#E2E8F0] bg-white text-[#183B3A] hover:bg-[#F5FAF9]">
                              <Link to="/admin/users"><ShieldCheck className="h-4 w-4" /> Counselor Profile</Link>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="space-y-3 p-3 sm:p-4 lg:hidden">
              {paged.map((session) => {
                const displayStatus = getDisplayStatus(session, now);
                return (
                  <Card key={session.id} hover={false} className="border-[#E2E8F0] bg-white shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <IconBadge
                          icon={session.mode === "online" ? Video : UserRound}
                          tone="teal"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#0D9488]">#{session.id}</p>
                          <p className="text-xs text-[#64748B]">{sessionTypeLabel(session.mode)}</p>
                        </div>
                      </div>
                      <Badge tone={statusBadgeTone(displayStatus)} className="shrink-0 capitalize">
                        {statusLabel(displayStatus)}
                      </Badge>
                    </div>

                    <div className="mt-4 grid gap-3 rounded-2xl border border-[#E2E8F0] bg-[#F5FAF9] p-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <UserAvatar
                          user={{ fullName: session.student_name || "Student", avatarUrl: session.student_avatar_url ?? null }}
                          size="md"
                          className="ring-1 ring-[#E2E8F0]"
                        />
                        <div className="min-w-0">
                          <p className="text-xs text-[#64748B]">Student</p>
                          <p className="truncate text-sm font-medium text-[#183B3A]">{session.student_name || "Student"}</p>
                          <p className="truncate text-xs text-[#64748B]">Student ID: {session.student_user_id}</p>
                        </div>
                      </div>
                      <div className="flex min-w-0 items-center gap-3">
                        <UserAvatar
                          user={{ fullName: session.counselor_name || "Counselor", avatarUrl: session.counselor_avatar_url ?? null }}
                          size="md"
                          className="ring-1 ring-[#E2E8F0]"
                        />
                        <div className="min-w-0">
                          <p className="text-xs text-[#64748B]">Counselor</p>
                          <p className="truncate text-sm font-medium text-[#183B3A]">{session.counselor_name || "Counselor"}</p>
                          <p className="truncate text-xs text-[#64748B]">Profile ID: {session.counselor_profile_id}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-2 text-sm text-[#183B3A]">
                      <div className="flex min-w-0 items-center gap-2">
                        <Calendar className="h-4 w-4 shrink-0 text-[#0D9488]" />
                        <span className="min-w-0 break-words">{formatDate(session.slot_start)}</span>
                      </div>
                      <div className="flex min-w-0 items-center gap-2">
                        <Clock className="h-4 w-4 shrink-0 text-[#0D9488]" />
                        <span className="min-w-0 break-words">{formatTime(session.slot_start)}</span>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2">
                      <Button
                        variant="secondary"
                        className="w-full border-[#E2E8F0] bg-white text-[#183B3A] hover:bg-[#F5FAF9]"
                        onClick={() => openDetails(session)}
                      >
                        <Eye className="h-4 w-4" /> View Details
                      </Button>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Button asChild variant="ghost" className="w-full border border-[#E2E8F0] bg-white text-[#183B3A] hover:bg-[#F5FAF9]">
                          <Link to="/admin/users"><UserRound className="h-4 w-4" /> Student Profile</Link>
                        </Button>
                        <Button asChild variant="ghost" className="w-full border border-[#E2E8F0] bg-white text-[#183B3A] hover:bg-[#F5FAF9]">
                          <Link to="/admin/users"><ShieldCheck className="h-4 w-4" /> Counselor Profile</Link>
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-3 border-t border-[#E2E8F0] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-sm text-[#64748B]">
                Showing <span className="font-medium text-[#183B3A]">{(currentPage - 1) * PAGE_SIZE + 1}</span>–
                <span className="font-medium text-[#183B3A]">{Math.min(currentPage * PAGE_SIZE, sorted.length)}</span> of{" "}
                <span className="font-medium text-[#183B3A]">{sorted.length}</span> records
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="min-h-11 border-[#E2E8F0] bg-white text-[#183B3A] hover:bg-[#F5FAF9]"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </Button>
                <div className="flex flex-wrap items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .map((p, idx, arr) => {
                      const prev = arr[idx - 1];
                      const gap = prev && p - prev > 1;
                      return (
                        <span key={p} className="flex items-center gap-1">
                          {gap ? <span className="px-1 text-[#64748B]">…</span> : null}
                          <button
                            type="button"
                            onClick={() => setPage(p)}
                            className={`h-11 min-w-11 rounded-lg border px-2 text-sm font-medium transition-colors ${
                              p === currentPage
                                ? "border-primary-dark bg-primary-dark text-white"
                                : "border-[#E2E8F0] bg-white text-[#183B3A] hover:bg-[#F5FAF9]"
                            }`}
                            aria-current={p === currentPage ? "page" : undefined}
                          >
                            {p}
                          </button>
                        </span>
                      );
                    })}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="min-h-11 border-[#E2E8F0] bg-white text-[#183B3A] hover:bg-[#F5FAF9]"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Details Modal */}
      <Modal
        open={Boolean(detailsAppt)}
        onClose={() => setDetailsAppt(null)}
        title="Session Details"
        description="Counseling session record and participants"
        size="lg"
        footer={
          <Button variant="secondary" onClick={() => setDetailsAppt(null)}>
            Close
          </Button>
        }
      >
        {detailsSnapshot ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-body">Session ID</p>
                <p className="mt-1 text-lg font-semibold text-heading">#{detailsSnapshot.id}</p>
              </div>
              <Badge tone={statusBadgeTone(getDisplayStatus(detailsSnapshot, Date.now()))} className="w-fit capitalize">
                {statusLabel(getDisplayStatus(detailsSnapshot, Date.now()))}
              </Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-canvas p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-body">Student</p>
                <div className="mt-2 flex items-center gap-3">
                  <UserAvatar
                    user={{
                      fullName: detailsSnapshot.student_name || "Student",
                      avatarUrl: detailsSnapshot.student_avatar_url ?? null,
                    }}
                    size="md"
                    className="ring-1 ring-border"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-heading">
                      {detailsSnapshot.student_name || "Student"}
                    </p>
                    <p className="text-sm text-body">Student ID: {detailsSnapshot.student_user_id}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-canvas p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-body">Counselor</p>
                <div className="mt-2 flex items-center gap-3">
                  <UserAvatar
                    user={{
                      fullName: detailsSnapshot.counselor_name || "Counselor",
                      avatarUrl: detailsSnapshot.counselor_avatar_url ?? null,
                    }}
                    size="md"
                    className="ring-1 ring-border"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-heading">
                      {detailsSnapshot.counselor_name || "Counselor"}
                    </p>
                    <p className="text-sm text-body">
                      Profile ID: {detailsSnapshot.counselor_profile_id}
                      {detailsSnapshot.counselor_user_id ? ` · User ID: ${detailsSnapshot.counselor_user_id}` : ""}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-body">Appointment date & time</p>
                <p className="mt-2 text-sm font-medium text-heading">
                  {formatDate(detailsSnapshot.slot_start)} · {formatTime(detailsSnapshot.slot_start)}
                </p>
                <p className="mt-1 text-sm text-body">
                  Ends: {formatDate(detailsSnapshot.slot_end)} · {formatTime(detailsSnapshot.slot_end)}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-body">Session type & status</p>
                <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-heading">
                  {detailsSnapshot.mode === "online" ? (
                    <Video className="h-4 w-4 text-primary" />
                  ) : (
                    <UserRound className="h-4 w-4 text-primary" />
                  )}
                  {sessionTypeLabel(detailsSnapshot.mode)}
                </p>
                <p className="mt-1 text-sm text-body">
                  Status: {statusLabel(getDisplayStatus(detailsSnapshot, Date.now()))}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-body">Created date</p>
                <p className="mt-2 text-sm text-heading">
                  {detailsSnapshot.created_at ? new Date(detailsSnapshot.created_at).toLocaleString() : "Not available"}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-body">Last updated</p>
                <p className="mt-2 text-sm text-heading">Not available in current record</p>
              </div>
            </div>

            {detailsSnapshot.concern_category ? (
              <div className="rounded-2xl border border-border bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-body">Concern category</p>
                <p className="mt-2 text-sm text-heading">{detailsSnapshot.concern_category}</p>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button asChild variant="secondary">
                <Link to="/admin/users">
                  <UserRound className="h-4 w-4" /> View Student Profile
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link to="/admin/users">
                  <ShieldCheck className="h-4 w-4" /> View Counselor Profile
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link to="/admin/appointments">
                  <Activity className="h-4 w-4" /> View Session Information
                </Link>
              </Button>
            </div>

            <p className="text-xs leading-relaxed text-body">
              Private counseling conversations and confidential counseling notes are not displayed here. Access to sensitive student information remains subject to administrator authorization and system policy.
            </p>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
