import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Primitives";
import { listNotifications, markNotificationRead, markAllNotificationsRead, type Notification } from "@/api/wellness";
import { Link } from "react-router";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const result = await listNotifications();
    setNotifications(result.notifications);
    setLoading(false);
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

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Notifications</h2>
        <button onClick={() => void readAll()} className="text-sm text-teal">
          Mark all as read
        </button>
      </div>
      {loading ? (
        <p className="mt-2 text-sm text-ink-400">Loading…</p>
      ) : notifications.length === 0 ? (
        <p className="mt-2 text-sm text-ink-400">No notifications yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {notifications.map((notification) => (
            <li key={notification.id} className="flex items-start justify-between gap-4 py-3">
              <div>
                <p className="font-medium">{notification.title}</p>
                <p className="mt-1 text-sm text-ink-400">{notification.body}</p>
                {notification.link ? (
                  <Link to={notification.link} className="mt-1 text-sm text-teal">
                    View
                  </Link>
                ) : null}
              </div>
              {!notification.readAt ? (
                <button
                  onClick={() => void read(notification.id)}
                  className="text-xs text-ink-400"
                >
                  Mark read
                </button>
              ) : (
                <span className="text-xs text-ink-300">Read</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
