import { useEffect, useState } from "react";
import { Card, Badge } from "@/components/ui/Primitives";
import { adminListUsers } from "@/api/wellness";
import UserAvatar from "@/components/profile/UserAvatar";

export default function AdminListPage({ role, title }: { role: string; title: string }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    void adminListUsers({ role })
      .then((result) => setUsers(result.users ?? []))
      .finally(() => setLoading(false));
  }, [role]);

  const statusTone = (status: string) => (status === "active" ? "success" : status === "inactive" || status === "disabled" ? "danger" : "neutral");

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-ink-400">View registered {role} accounts, contact information, and account status.</p>
          </div>
          <Badge tone="info">{users.length} {users.length === 1 ? "account" : "accounts"}</Badge>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-line/70 px-6 py-4">
          <h3 className="font-semibold">Account list</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-navy-050/70">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-400 sm:px-6">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-400 sm:px-6">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-400 sm:px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {loading ? (
                <tr><td colSpan={3} className="px-6 py-8 text-ink-400">Loading accounts…</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={3} className="px-6 py-8 text-ink-400">No {role} accounts found.</td></tr>
              ) : users.map((user) => (
                <tr key={user.id} className="transition-colors hover:bg-surface-2/30">
                  <td className="px-4 py-3 sm:px-6">
                    <div className="flex items-center gap-3">
                      <UserAvatar user={{ fullName: user.fullName ?? "User", avatarUrl: user.avatarUrl ?? null }} size="sm" />
                      <div>
                        <p className="font-medium text-ink">{user.fullName || "—"}</p>
                        <p className="text-xs text-ink-400">ID: {user.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-500 sm:px-6">{user.email || "—"}</td>
                  <td className="px-4 py-3 sm:px-6"><Badge tone={statusTone(user.status) as any} className="capitalize">{user.status || "unknown"}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
