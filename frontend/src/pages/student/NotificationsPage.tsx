import { useEffect, useMemo, useState } from "react";
import { Card, Badge, Button, IconBadge } from "@/components/ui/Primitives";
import { listNotifications, markNotificationRead, markAllNotificationsRead, type Notification } from "@/api/wellness";
import { Link } from "react-router";
import { Bell, CheckCheck, ExternalLink, Inbox } from "lucide-react";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const result = await listNotifications();
      setNotifications(result.notifications ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function read(id: number) {
    await markNotificationRead(id);
    void load();
  }

  async function readAll() {
    await markAllNotificationsRead();
    void load();
  }

  const unreadCount = useMemo(() => notifications.filter((n) => !n.readAt).length, [notifications]);

  return (
    <div className="flex flex-col gap-6">
      <Card className="relative overflow-hidden p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-teal/10 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <IconBadge icon={Bell} tone="teal" />
            <div>
              <h2 className="text-lg font-semibold">Notifications</h2>
              <p className="mt-1 text-sm text-ink-400">Stay updated on appointments, messages, check-ins, and important account activity.</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge tone={unreadCount > 0 ? "warning" : "success"}>{unreadCount} unread</Badge>
                <Badge tone="neutral">{notifications.length} total</Badge>
              </div>
            </div>
          </div>
          <Button variant="secondary" onClick={() => void readAll()} disabled={unreadCount === 0 || loading}>
            <CheckCheck className="h-4 w-4" /> Mark all as read
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-line/70 px-6 py-4">
          <h3 className="font-semibold">Recent updates</h3>
          <p className="mt-1 text-sm text-ink-400">Tap “View” to open related pages or mark items as read.</p>
        </div>
        {loading ? (
          <p className="px-6 py-8 text-sm text-ink-400">Loading notifications…</p>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-mint-soft text-teal ring-1 ring-teal/20"><Inbox className="h-6 w-6" /></span>
            <div>
              <p className="font-medium">No notifications yet</p>
              <p className="mt-1 text-sm text-ink-400">When there’s new activity, updates will appear here.</p>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-line/70">
            {notifications.map((notification) => (
              <li key={notification.id} className={`flex flex-col gap-3 px-6 py-4 transition-colors sm:flex-row sm:items-start sm:justify-between ${!notification.readAt ? "bg-mint-soft/20" : ""}`}>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-ink">{notification.title}</p>
                    {!notification.readAt ? <Badge tone="teal">New</Badge> : <Badge tone="neutral">Read</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-ink-500">{notification.body}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink-400">
                    {notification.createdAt ? <span>{new Date(notification.createdAt).toLocaleString("en-PH")}</span> : null}
                    {notification.link ? (
                      <Link to={notification.link} className="inline-flex items-center gap-1 font-medium text-teal hover:underline">
                        View details <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    ) : null}
                  </div>
                </div>
                {!notification.readAt ? (
                  <Button variant="ghost" size="sm" onClick={() => void read(notification.id)} className="shrink-0 self-start">
                    Mark read
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
