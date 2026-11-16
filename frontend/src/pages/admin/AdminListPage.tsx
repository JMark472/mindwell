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
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="bg-navy-050">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium sm:px-6">Name</th>
              <th className="px-4 py-2 text-left text-xs font-medium sm:px-6">Email</th>
              <th className="px-4 py-2 text-left text-xs font-medium sm:px-6">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3 sm:px-6">{user.fullName}</td>
                <td className="px-4 py-3 text-ink-400 sm:px-6">{user.email}</td>
                <td className="px-4 py-3 capitalize sm:px-6">{user.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
