import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AdminShell } from "@/components/layout/admin-guard";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/input";
import { adminDeleteMessage, adminListMessages, adminUpdateMessage } from "@/lib/server/admin";
import { formatDateTime } from "@/lib/utils";
import type { ContactMessage } from "@/lib/types";

export const Route = createFileRoute("/admin/inbox")({ component: AdminInbox });

function AdminInbox() {
  const [rows, setRows] = useState<ContactMessage[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  function reload() {
    void adminListMessages()
      .then((list) => {
        setRows(list);
        const map: Record<string, string> = {};
        for (const m of list) map[m.id] = m.staffNotes ?? "";
        setNotes(map);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Unable to load inbox."));
  }

  useEffect(() => {
    reload();
  }, []);

  return (
    <AdminShell>
      <h1 className="font-display text-2xl font-semibold">Inbox</h1>
      <p className="mt-1 text-sm text-mist">Messages from the public contact desk — claims, pickups, and billing.</p>
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      {!rows ? (
        <Skeleton className="mt-6 h-48" />
      ) : rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No messages yet" description="Contact form submissions appear here." />
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {rows.map((m) => (
            <Card key={m.id} className="rounded-xl shadow-card">
              <CardContent className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{m.name}</p>
                    <p className="text-sm text-mist">
                      {m.email} · {m.topic} · {formatDateTime(m.createdAt)}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-wider text-mist">
                      Status: {m.status ?? "open"}
                      {m.resolvedAt ? ` · resolved ${formatDateTime(m.resolvedAt)}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        void adminUpdateMessage({ data: { id: m.id, status: "in_progress", staffNotes: notes[m.id] } })
                          .then(() => {
                            toast.success("Marked in progress.");
                            reload();
                          })
                          .catch((e) => toast.error(e instanceof Error ? e.message : "Failed."));
                      }}
                    >
                      In progress
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        void adminUpdateMessage({ data: { id: m.id, status: "resolved", staffNotes: notes[m.id] } })
                          .then(() => {
                            toast.success("Resolved.");
                            reload();
                          })
                          .catch((e) => toast.error(e instanceof Error ? e.message : "Failed."));
                      }}
                    >
                      Resolve
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        void adminDeleteMessage({ data: { id: m.id } })
                          .then(() => {
                            toast.success("Removed.");
                            reload();
                          })
                          .catch((e) => toast.error(e instanceof Error ? e.message : "Could not remove."));
                      }}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{m.message}</p>
                <Textarea
                  className="mt-3"
                  placeholder="Staff notes"
                  value={notes[m.id] ?? ""}
                  onChange={(e) => setNotes((prev) => ({ ...prev, [m.id]: e.target.value }))}
                />
                <Button
                  className="mt-2"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    void adminUpdateMessage({ data: { id: m.id, staffNotes: notes[m.id] } })
                      .then(() => toast.success("Notes saved."))
                      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed."));
                  }}
                >
                  Save notes
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
