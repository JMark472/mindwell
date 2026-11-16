import { useEffect, useState } from "react";
import { Card, Button, Input } from "@/components/ui/Primitives";
import { adminListUsers, adminCreateUser, adminSetUserStatus } from "@/api/wellness";
import { errorMessage } from "@/api/client";
import UserAvatar from "@/components/profile/UserAvatar";

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [form, setForm] = useState({ fullName: "", email: "", password: "", role: "admin" });
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const result = await adminListUsers();
    setUsers(result.users ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function create() {
    setError(null);
    try {
      await adminCreateUser(form);
      setForm({ fullName: "", email: "", password: "", role: "admin" });
      await load();
    } catch (err) {
      setError(errorMessage(err, "Could not create user."));
    }
  }

  async function setStatus(id: number, status: string) {
    await adminSetUserStatus(id, status);
    await load();
  }

  // Role changes restricted to Admin only as per requirements.

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold">Create user</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input placeholder="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="h-11 w-full rounded-field border border-line px-3 text-sm"
            disabled
          >
            <option value="admin">Admin</option>
          </select>
        </div>
        {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
        <Button className="mt-4 w-full sm:w-auto" onClick={() => void create()}>
          Create user
        </Button>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-lg font-semibold">Users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-navy-050">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium sm:px-6">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium sm:px-6">Email</th>
                <th className="px-4 py-2 text-left text-xs font-medium sm:px-6">Role</th>
                <th className="px-4 py-2 text-left text-xs font-medium sm:px-6">Status</th>
                <th className="px-4 py-2 text-right text-xs font-medium sm:px-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3 sm:px-6">
                    <div className="flex min-w-[180px] items-center gap-3">
                      <UserAvatar
                        user={{
                          fullName: user.fullName || user.email,
                          avatarUrl: user.avatarUrl || user.avatar_url || null,
                        }}
                        size="md"
                      />
                      <span className="font-medium">{user.fullName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-400 sm:px-6">{user.email}</td>
                  <td className="px-4 py-3 sm:px-6">
                    <span className="rounded-pill bg-navy-050 px-2 py-0.5 text-xs">{user.role}</span>
                  </td>
                  <td className="px-4 py-3 sm:px-6">
                    <select
                      value={user.status}
                      onChange={(e) => void setStatus(user.id, e.target.value)}
                      className="rounded-field border border-line px-2 py-1 text-xs"
                    >
                      <option value="active">active</option>
                      <option value="inactive">inactive</option>
                      <option value="suspended">suspended</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right text-ink-400 sm:px-6">Manage</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
