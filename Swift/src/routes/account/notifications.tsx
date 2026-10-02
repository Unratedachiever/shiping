import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { DashShell, ACCOUNT_LINKS } from "@/components/layout/dash-shell";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { listMyNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/server/account";
import { formatDateTime } from "@/lib/utils";
import type { AppNotification } from "@/lib/types";

export const Route = createFileRoute("/account/notifications")({ component: NotesPage });

function NotesPage() {
  const [rows, setRows] = useState<AppNotification[]>([]);
  function reload() {
    void listMyNotifications().then(setRows);
  }
  useEffect(() => {
    reload();
  }, []);
  const unread = rows.filter((n) => !n.read).length;

  return (
    <DashShell title="Account" links={ACCOUNT_LINKS}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Notifications</h1>
          <p className="mt-1 text-sm text-mist">
            In-app notices for created, picked up, departed, arrived, delayed, out for delivery, and delivered.
            {unread ? ` ${unread} unread.` : ""}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={unread === 0}
          onClick={() => {
            void markAllNotificationsRead()
              .then(() => {
                toast.success("All marked read.");
                reload();
              })
              .catch((e) => toast.error(e instanceof Error ? e.message : "Failed."));
          }}
        >
          Mark all read
        </Button>
      </div>
      <div className="mt-4 divide-y divide-line rounded-xl border border-line bg-card">
        {rows.length === 0 ? (
          <div className="p-2">
            <EmptyState
              title="No notifications yet"
              description="Status updates for your shipments will appear here."
              className="border-0 bg-transparent"
            />
          </div>
        ) : null}
        {rows.map((n) => (
          <div
            key={n.id}
            className={`flex items-start justify-between gap-3 p-4 ${n.read ? "" : "bg-accent/30"}`}
          >
            <div>
              <p className={n.read ? "font-medium text-mist" : "font-medium"}>{n.title}</p>
              <p className="mt-1 text-sm text-mist">{n.body}</p>
              <p className="mt-1 text-xs text-mist">{formatDateTime(n.createdAt)}</p>
              {n.shipmentId ? (
                <Link
                  to="/account/shipments/$id"
                  params={{ id: n.shipmentId }}
                  className="mt-2 inline-block text-sm text-teal"
                >
                  View shipment
                </Link>
              ) : null}
            </div>
            {!n.read ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => void markNotificationRead({ data: { id: n.id } }).then(reload)}
              >
                Mark read
              </Button>
            ) : null}
          </div>
        ))}
      </div>
    </DashShell>
  );
}
