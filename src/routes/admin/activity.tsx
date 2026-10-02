import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/layout/admin-guard";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { adminListActivity } from "@/lib/server/admin";
import { formatDateTime } from "@/lib/utils";
import type { AdminActivity } from "@/lib/types";

export const Route = createFileRoute("/admin/activity")({ component: AdminActivityPage });

function AdminActivityPage() {
  const [rows, setRows] = useState<AdminActivity[] | null>(null);

  useEffect(() => {
    void adminListActivity().then(setRows).catch(() => setRows([]));
  }, []);

  return (
    <AdminShell>
      <h1 className="font-display text-2xl font-semibold">Activity log</h1>
      <p className="mt-1 text-sm text-mist">
        Audit-style trail of admin status changes, bulk updates, inbox actions, and DEMO seeds. Requires migration
        0005.
      </p>
      {!rows ? (
        <Skeleton className="mt-6 h-48" />
      ) : rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No activity recorded yet"
            description="Update a shipment status or seed DEMO data to populate this log."
          />
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-card shadow-card">
          <table className="data-table min-w-[720px]">
            <thead>
              <tr>
                <th>When</th>
                <th>Action</th>
                <th>Summary</th>
                <th>Entity</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap text-mist">{formatDateTime(r.createdAt)}</td>
                  <td className="font-mono text-xs">{r.action}</td>
                  <td>{r.summary}</td>
                  <td className="text-xs text-mist">
                    {r.entityType}
                    {r.entityId ? ` · ${r.entityId.slice(0, 12)}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
