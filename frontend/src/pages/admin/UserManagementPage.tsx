import { useEffect, useMemo, useState } from "react";
import { Card, Button, Input } from "@/components/ui/Primitives";
import {
  adminCreateUser,
  adminListCounselorProfiles,
  adminListUsers,
  adminResetPassword,
  adminSetPassword,
  adminSetUserStatus,
  adminUpdateUser,
} from "@/api/wellness";
import { errorMessage } from "@/api/client";
import UserAvatar from "@/components/profile/UserAvatar";
import { Copy, Eye, EyeOff, KeyRound, Pencil, RefreshCw, Save, Shield, UserPlus, X } from "lucide-react";

type StudentProfile = {
  studentNumber?: string | null;
  program?: string | null;
  yearLevel?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
};

type AdminUser = {
  id: number;
  email: string;
  fullName: string;
  role: "student" | "counselor" | "admin";
  status: "active" | "inactive" | "suspended";
  phone: string | null;
  avatarUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
  studentProfile?: StudentProfile | null;
};

type CounselorProfile = {
  id: number;
  user_id: number;
  name: string;
  avatar_url?: string | null;
  specialization: string | null;
  credentials: string | null;
  bio: string | null;
  max_weekly_appointments?: number;
  accepting_students?: boolean;
};

function fmtDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString();
}

function Field({ label, value }: { label: string; value?: string | number | boolean | null }) {
  const display =
    value === null || value === undefined || value === ""
      ? "—"
      : typeof value === "boolean"
        ? value
          ? "Yes"
          : "No"
        : String(value);
  return (
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-wide text-ink-400">{label}</p>
      <p className="break-words text-sm text-ink">{display}</p>
    </div>
  );
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [counselorProfiles, setCounselorProfiles] = useState<CounselorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "student" | "counselor" | "admin">("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  const [form, setForm] = useState({ fullName: "", email: "", password: "", role: "student" });
  const [createBusy, setCreateBusy] = useState(false);

  const [pwOpen, setPwOpen] = useState<number | null>(null);
  const [pwMode, setPwMode] = useState<"generate" | "set">("generate");
  const [pwValue, setPwValue] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [revealed, setRevealed] = useState<Record<number, string>>({});
  const [showPw, setShowPw] = useState(false);

  const [editId, setEditId] = useState<number | null>(null);
  const [editBusy, setEditBusy] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    studentNumber: "",
    program: "",
    yearLevel: "",
    dateOfBirth: "",
    gender: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
  });

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, counselors] = await Promise.all([
        adminListUsers(filter === "all" ? undefined : { role: filter }),
        adminListCounselorProfiles().catch(() => [] as CounselorProfile[]),
      ]);
      setUsers((usersRes.users ?? []) as AdminUser[]);
      setCounselorProfiles(counselors as CounselorProfile[]);
    } catch (err) {
      setError(errorMessage(err, "Could not load users."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const counselorByUserId = useMemo(() => {
    const map = new Map<number, CounselorProfile>();
    for (const c of counselorProfiles) map.set(Number(c.user_id), c);
    return map;
  }, [counselorProfiles]);

  const visibleUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const cp = counselorByUserId.get(u.id);
      const sp = u.studentProfile;
      return [
        u.fullName,
        u.email,
        u.phone ?? "",
        u.role,
        u.status,
        sp?.studentNumber ?? "",
        sp?.program ?? "",
        sp?.yearLevel ?? "",
        cp?.specialization ?? "",
        cp?.credentials ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [users, search, counselorByUserId]);

  async function create() {
    setError(null);
    setNotice(null);
    if (!form.fullName || !form.email || !form.password) {
      setError("Full name, email, and password are required.");
      return;
    }
    setCreateBusy(true);
    try {
      await adminCreateUser(form);
      setForm({ fullName: "", email: "", password: "", role: "student" });
      setNotice("User account created successfully.");
      await load();
    } catch (err) {
      setError(errorMessage(err, "Could not create user."));
    } finally {
      setCreateBusy(false);
    }
  }

  async function setStatus(id: number, status: string) {
    setError(null);
    try {
      await adminSetUserStatus(id, status);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: status as AdminUser["status"] } : u)));
      setNotice("User status updated.");
    } catch (err) {
      setError(errorMessage(err, "Could not update status."));
    }
  }

  async function applyPassword(id: number) {
    setError(null);
    setNotice(null);
    if (pwMode === "set" && pwValue.trim().length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setPwBusy(true);
    try {
      const res =
        pwMode === "generate"
          ? await adminResetPassword(id)
          : await adminSetPassword(id, { password: pwValue });
      setRevealed((prev) => ({ ...prev, [id]: res.temporaryPassword }));
      setPwValue("");
      setPwOpen(null);
      setNotice("Password updated. Copy it now — it is shown only once.");
    } catch (err) {
      setError(errorMessage(err, "Could not update password."));
    } finally {
      setPwBusy(false);
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setNotice("Password copied to clipboard.");
    } catch {
      setNotice("Copy failed. Please copy the password manually.");
    }
  }

  function startEdit(u: AdminUser) {
    setError(null);
    setNotice(null);
    setEditId(u.id);
    setExpanded(u.id);
    setEditForm({
      fullName: u.fullName ?? "",
      email: u.email ?? "",
      phone: u.phone ?? "",
      studentNumber: u.studentProfile?.studentNumber ?? "",
      program: u.studentProfile?.program ?? "",
      yearLevel: u.studentProfile?.yearLevel ?? "",
      dateOfBirth: u.studentProfile?.dateOfBirth ? String(u.studentProfile.dateOfBirth).slice(0, 10) : "",
      gender: u.studentProfile?.gender ?? "",
      emergencyContactName: u.studentProfile?.emergencyContactName ?? "",
      emergencyContactPhone: u.studentProfile?.emergencyContactPhone ?? "",
    });
  }

  function cancelEdit() {
    setEditId(null);
  }

  async function saveEdit(u: AdminUser) {
    setEditBusy(true);
    setError(null);
    setNotice(null);
    try {
      const payload: Record<string, unknown> = {
        fullName: editForm.fullName.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim() || null,
      };
      if (u.role === "student") {
        payload.studentNumber = editForm.studentNumber.trim() || null;
        payload.program = editForm.program.trim() || null;
        payload.yearLevel = editForm.yearLevel.trim() || null;
        payload.dateOfBirth = editForm.dateOfBirth || null;
        payload.gender = editForm.gender.trim() || null;
        payload.emergencyContactName = editForm.emergencyContactName.trim() || null;
        payload.emergencyContactPhone = editForm.emergencyContactPhone.trim() || null;
      }
      const updated = await adminUpdateUser(u.id, payload);
      if (updated) {
        setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, ...(updated as any) } : x)));
      } else {
        await load();
      }
      setEditId(null);
      setNotice("User information updated.");
    } catch (err) {
      setError(errorMessage(err, "Could not update user information."));
    } finally {
      setEditBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-teal" />
              <h2 className="text-lg font-semibold">Create user account</h2>
            </div>
            <p className="mt-1 text-sm text-ink-400">
              Create student, counselor, or admin accounts. Passwords are stored securely (hashed) and never shown after save; set/reset shows the new password once.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input placeholder="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          <Input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input placeholder="Password (min 8 chars)" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="h-11 w-full rounded-field border border-line/80 bg-white px-4 py-2.5 text-sm shadow-sm"
          >
            <option value="student">Student</option>
            <option value="counselor">Counselor</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-status-danger">{error}</div>
          <Button onClick={() => void create()} disabled={createBusy}>{createBusy ? "Creating…" : "Create user"}</Button>
        </div>
        {notice ? <p className="mt-2 text-xs text-teal-700">{notice}</p> : null}
      </Card>

      <Card className="p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-navy" />
              <h2 className="text-lg font-semibold">Students, counselors & account information</h2>
            </div>
            <p className="mt-1 text-sm text-ink-400">
              View and edit account and student profile information, manage status, and set/reset passwords (shown once). Updates are saved and reflected immediately. Private counseling records are not accessible to admins.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Input className="w-64" placeholder="Search name, email, ID, program…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <select value={filter} onChange={(e) => setFilter(e.target.value as "all" | "student" | "counselor" | "admin")} className="h-11 rounded-field border border-line/80 bg-white px-3 text-sm shadow-sm">
              <option value="all">All roles</option>
              <option value="student">Students</option>
              <option value="counselor">Counselors</option>
              <option value="admin">Admins</option>
            </select>
            <Button variant="secondary" onClick={() => void load()}><RefreshCw className="h-4 w-4" /> Refresh</Button>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {loading ? <p className="text-sm text-ink-400">Loading users…</p> : null}
          {!loading && visibleUsers.length === 0 ? <p className="text-sm text-ink-400">No users found.</p> : null}
          {visibleUsers.map((u) => {
            const cp = counselorByUserId.get(u.id);
            const sp = u.studentProfile;
            const isOpen = expanded === u.id;
            const revealedPw = revealed[u.id];
            return (
              <div key={u.id} className="rounded-2xl border border-line/70 bg-white p-4 shadow-card">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setExpanded(isOpen ? null : u.id)}>
                    <UserAvatar user={{ fullName: u.fullName, avatarUrl: u.avatarUrl || null }} size="md" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium text-ink">{u.fullName}</p>
                        <span className="rounded-pill bg-navy-050 px-2 py-0.5 text-[11px] font-medium capitalize text-navy">{u.role}</span>
                        <span className="rounded-pill bg-surface px-2 py-0.5 text-[11px] capitalize text-ink-600">{u.status}</span>
                      </div>
                      <p className="truncate text-sm text-ink-400">{u.email}{u.phone ? ` · ${u.phone}` : ""}</p>
                      {u.role === "student" ? (
                        <p className="mt-0.5 text-xs text-ink-400">Student ID: {sp?.studentNumber || "—"} · Year: {sp?.yearLevel || "—"} · {sp?.program || "—"}</p>
                      ) : null}
                      {u.role === "counselor" ? (
                        <p className="mt-0.5 text-xs text-ink-400">{cp?.specialization || "Counselor"}{cp?.credentials ? ` · ${cp.credentials}` : ""}{cp ? ` · ${cp.accepting_students ? "Accepting students" : "Not accepting"}` : ""}</p>
                      ) : null}
                    </div>
                  </button>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" onClick={() => (editId === u.id ? cancelEdit() : startEdit(u))}>
                      {editId === u.id ? <><X className="h-3.5 w-3.5" /> Cancel</> : <><Pencil className="h-3.5 w-3.5" /> Edit</>}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => void setStatus(u.id, "active")}>Activate</Button>
                    <Button size="sm" variant="ghost" onClick={() => void setStatus(u.id, "inactive")}>Disable</Button>
                    <Button size="sm" variant="secondary" onClick={() => setPwOpen(pwOpen === u.id ? null : u.id)}><KeyRound className="h-3.5 w-3.5" /> Password</Button>
                  </div>
                </div>

                {pwOpen === u.id ? (
                  <div className="mt-4 rounded-xl border border-line/70 bg-surface/60 p-4">
                    <p className="text-sm font-medium">Set or reset password</p>
                    <p className="mt-1 text-xs text-ink-400">The new password will be shown once. Share it securely with the user. Existing passwords cannot be displayed.</p>
                    <div className="mt-3 flex flex-wrap items-end gap-2">
                      <select value={pwMode} onChange={(e) => setPwMode(e.target.value as "generate" | "set")} className="h-10 rounded-field border border-line/80 bg-white px-3 text-sm">
                        <option value="generate">Generate temporary password</option>
                        <option value="set">Set specific password</option>
                      </select>
                      {pwMode === "set" ? (
                        <Input className="w-64" type={showPw ? "text" : "password"} placeholder="New password (min 8)" value={pwValue} onChange={(e) => setPwValue(e.target.value)} />
                      ) : null}
                      {pwMode === "set" ? (
                        <Button variant="ghost" size="sm" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? "Hide password" : "Show password"}>{showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
                      ) : null}
                      <Button size="sm" onClick={() => void applyPassword(u.id)} disabled={pwBusy}>{pwBusy ? "Saving…" : "Apply"}</Button>
                    </div>
                  </div>
                ) : null}

                {revealedPw ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
                    <span className="font-medium text-amber-900">New password (shown once):</span>
                    <code className="rounded bg-white px-2 py-0.5 font-mono text-amber-900">{revealedPw}</code>
                    <Button size="sm" variant="secondary" onClick={() => void copy(revealedPw)}><Copy className="h-3.5 w-3.5" /> Copy</Button>
                    <Button size="sm" variant="ghost" onClick={() => setRevealed((p) => { const n = { ...p }; delete n[u.id]; return n; })}>Hide</Button>
                  </div>
                ) : null}

                {isOpen ? (
                  <div className="mt-4 border-t border-line/70 pt-4">
                    {editId === u.id ? (
                      <div className="rounded-xl border border-line/70 bg-surface/40 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">Edit {u.role} information</p>
                            <p className="mt-0.5 text-xs text-ink-400">Update account and profile details. Changes are saved immediately and reflected in the list.</p>
                          </div>
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-ink-600">Full name</label>
                            <Input value={editForm.fullName} onChange={(e) => setEditForm((f) => ({ ...f, fullName: e.target.value }))} />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-ink-600">Email</label>
                            <Input type="email" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-ink-600">Phone</label>
                            <Input value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} />
                          </div>
                          {u.role === "student" ? (
                            <>
                              <div className="sm:col-span-2 lg:col-span-3 mt-1 text-xs font-semibold uppercase tracking-wide text-ink-400">Student profile information</div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium text-ink-600">Student number</label>
                                <Input value={editForm.studentNumber} onChange={(e) => setEditForm((f) => ({ ...f, studentNumber: e.target.value }))} />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium text-ink-600">Year level</label>
                                <Input value={editForm.yearLevel} onChange={(e) => setEditForm((f) => ({ ...f, yearLevel: e.target.value }))} />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium text-ink-600">Program</label>
                                <Input value={editForm.program} onChange={(e) => setEditForm((f) => ({ ...f, program: e.target.value }))} />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium text-ink-600">Date of birth</label>
                                <Input type="date" value={editForm.dateOfBirth} onChange={(e) => setEditForm((f) => ({ ...f, dateOfBirth: e.target.value }))} />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium text-ink-600">Gender</label>
                                <Input value={editForm.gender} onChange={(e) => setEditForm((f) => ({ ...f, gender: e.target.value }))} />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium text-ink-600">Emergency contact name</label>
                                <Input value={editForm.emergencyContactName} onChange={(e) => setEditForm((f) => ({ ...f, emergencyContactName: e.target.value }))} />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium text-ink-600">Emergency contact phone</label>
                                <Input value={editForm.emergencyContactPhone} onChange={(e) => setEditForm((f) => ({ ...f, emergencyContactPhone: e.target.value }))} />
                              </div>
                            </>
                          ) : null}
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button size="sm" onClick={() => void saveEdit(u)} disabled={editBusy}><Save className="h-3.5 w-3.5" /> {editBusy ? "Saving…" : "Save changes"}</Button>
                          <Button size="sm" variant="ghost" onClick={cancelEdit} disabled={editBusy}>Cancel</Button>
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Field label="User ID" value={u.id} />
                    <Field label="Email" value={u.email} />
                    <Field label="Phone" value={u.phone} />
                    <Field label="Role" value={u.role} />
                    <Field label="Status" value={u.status} />
                    <Field label="Created" value={fmtDate(u.createdAt)} />
                    <Field label="Updated" value={fmtDate(u.updatedAt)} />
                    <Field label="Avatar" value={u.avatarUrl ? "Uploaded" : "None"} />

                    {u.role === "student" ? (
                      <>
                        <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-ink-400 sm:col-span-2 lg:col-span-3">Student profile information</div>
                        <Field label="Student number" value={sp?.studentNumber} />
                        <Field label="Year level" value={sp?.yearLevel} />
                        <Field label="Program" value={sp?.program} />
                        <Field label="Date of birth" value={sp?.dateOfBirth ? String(sp.dateOfBirth).slice(0, 10) : null} />
                        <Field label="Gender" value={sp?.gender} />
                        <Field label="Emergency contact" value={sp?.emergencyContactName} />
                        <Field label="Emergency phone" value={sp?.emergencyContactPhone} />
                        {!sp ? <p className="text-xs text-ink-400 sm:col-span-2 lg:col-span-3">No student profile record found.</p> : null}
                      </>
                    ) : null}

                    {u.role === "counselor" ? (
                      <>
                        <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-ink-400 sm:col-span-2 lg:col-span-3">Counselor account & professional information</div>
                        <Field label="Counselor profile ID" value={cp?.id} />
                        <Field label="Specialization" value={cp?.specialization} />
                        <Field label="Credentials" value={cp?.credentials} />
                        <Field label="Accepting students" value={cp?.accepting_students} />
                        <Field label="Max weekly appointments" value={cp?.max_weekly_appointments} />
                        <div className="sm:col-span-2 lg:col-span-3"><Field label="Bio" value={cp?.bio} /></div>
                        {!cp ? <p className="text-xs text-ink-400 sm:col-span-2 lg:col-span-3">No counselor profile record found yet (will be created when the counselor sets up their profile).</p> : null}
                      </>
                    ) : null}

                    {u.role === "admin" ? (
                      <p className="text-xs text-ink-400 sm:col-span-2 lg:col-span-3">Admin account: full administrative access per system permissions. Passwords are securely hashed and cannot be displayed; use the Password action to set or generate a new one (shown once).</p>
                    ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
