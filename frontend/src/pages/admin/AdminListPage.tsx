import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Primitives";
import { adminListUsers } from "@/api/wellness";

export default function AdminListPage({ role, title }: { role: string; title: string }) {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    void adminListUsers({ role }).then((result) => setUsers(result.users ?? []));
  }, [role]);

  return (
    <Card className="overflow-hidden">
      <div className="px-6 py-4">
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-navy-050">
          <tr>
            <th className="px-6 py-2 text-left text-xs font-medium">Name</th>
            <th className="px-6 py-2 text-left text-xs font-medium">Email</th>
            <th className="px-6 py-2 text-left text-xs font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {users.map((user) => (
            <tr key={user.id}>
              <td className="px-6 py-3">{user.fullName}</td>
              <td className="px-6 py-3 text-ink-400">{user.email}</td>
              <td className="px-6 py-3 capitalize">{user.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
