import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminShell } from "@/components/layout/admin-guard";
import { Skeleton } from "@/components/ui/skeleton";
import { adminListPayments } from "@/lib/server/admin";
import { formatDateTime, money } from "@/lib/utils";
import type { AdminPayment } from "@/lib/types";

export const Route = createFileRoute("/admin/payments")({ component: AdminPayments });

function AdminPayments() {
  const [rows, setRows] = useState<AdminPayment[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void adminListPayments()
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : "Unable to load payments."));
  }, []);

  const total = rows?.reduce((sum, r) => sum + r.total, 0) ?? 0;

  return (
    <AdminShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Payments</h1>
          <p className="mt-1 text-sm text-mist">Charges recorded at checkout. Full card numbers are never stored.</p>
        </div>
        {rows ? <p className="text-sm text-mist">{rows.length} charges · {money(total)}</p> : null}
      </div>
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      {!rows ? (
        <Skeleton className="mt-6 h-48" />
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-card">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wider text-mist">
              <tr>
                <th className="px-3 py-3">When</th>
                <th className="px-3 py-3">Tracking</th>
                <th className="px-3 py-3">Parties</th>
                <th className="px-3 py-3">Method</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0">
                  <td className="px-3 py-3 text-mist">{formatDateTime(r.createdAt)}</td>
                  <td className="px-3 py-3">
                    <Link to="/admin/shipments/$id" params={{ id: r.shipmentId }} className="font-mono text-xs text-teal">
                      {r.trackingNumber}
                    </Link>
                  </td>
                  <td className="px-3 py-3">
                    {r.senderName} → {r.recipientName}
                  </td>
                  <td className="px-3 py-3 capitalize">
                    {r.method}
                    {r.last4 ? ` ···· ${r.last4}` : ""}
                  </td>
                  <td className="px-3 py-3 capitalize">{r.status}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{money(r.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 ? <p className="p-6 text-sm text-mist">No payments yet. Charges appear after checkout.</p> : null}
        </div>
      )}
    </AdminShell>
  );
}
