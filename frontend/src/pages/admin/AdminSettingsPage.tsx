import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Primitives";
import { adminListAuditLogs } from "@/api/wellness";

export default function AdminSettingsPage() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    void adminListAuditLogs().then((result) => setLogs(result.logs ?? []));
  }, []);

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold">Audit logs</h2>
      <p className="mt-1 text-sm text-ink-400">
        Immutable record of administrative actions.
      </p>
      <ul className="mt-4 divide-y divide-line">
        {logs.map((log) => (
          <li key={log.id} className="py-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">{log.action}</span>
              <span className="text-ink-400">
                {log.createdAt ? new Date(log.createdAt).toLocaleString("en-PH") : "—"}
              </span>
            </div>
            <p className="text-xs text-ink-400">
              Actor {log.actorUserId} • {log.entityType} {log.entityId ?? ""}
            </p>
          </li>
        ))}
      </ul>
      {logs.length === 0 ? <p className="mt-2 text-sm text-ink-400">No audit entries yet.</p> : null}
    </Card>
  );
}
