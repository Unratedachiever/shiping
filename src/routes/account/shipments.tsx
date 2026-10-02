import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { DashShell, ACCOUNT_LINKS } from "@/components/layout/dash-shell";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { listMyShipments } from "@/lib/server/shipments";
import { downloadCsv, shipmentsToCsv } from "@/lib/csv";
import { formatDate } from "@/lib/utils";
import { SHIPMENT_STATUSES } from "@/lib/status";
import type { Shipment } from "@/lib/types";

export const Route = createFileRoute("/account/shipments")({ component: AccountShipments });

function AccountShipments() {
  const [rows, setRows] = useState<Shipment[] | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    void listMyShipments().then(setRows).catch(() => setRows([]));
  }, []);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const needle = q.trim().toLowerCase();
    return rows.filter((s) => {
      if (status && s.status !== status) return false;
      if (!needle) return true;
      const blob = `${s.trackingNumber} ${s.sender.city} ${s.recipient.city} ${s.recipient.fullName}`.toLowerCase();
      return blob.includes(needle);
    });
  }, [rows, q, status]);

  return (
    <DashShell title="Account" links={ACCOUNT_LINKS}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Shipment history</h1>
          <p className="mt-1 text-sm text-mist">Search, filter, and export your bookings.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!rows || rows.length === 0}
          onClick={() => {
            if (!rows) return;
            downloadCsv(`swiftship-shipments-${new Date().toISOString().slice(0, 10)}.csv`, shipmentsToCsv(rows));
          }}
        >
          <Download className="size-4" /> Export CSV
        </Button>
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="Search tracking, cities, recipient"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search shipments"
        />
        <NativeSelect
          className="sm:w-48"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {SHIPMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replaceAll("_", " ")}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="mt-4 space-y-2">
        {!rows ? (
          <Skeleton className="h-40" />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={rows.length === 0 ? "No shipments yet" : "No matches"}
            description={rows.length === 0 ? "Create a shipment to see it here." : "Try a different search or status filter."}
            action={
              rows.length === 0 ? (
                <Button asChild>
                  <Link to="/ship">Ship now</Link>
                </Button>
              ) : null
            }
          />
        ) : (
          filtered.map((s) => (
            <Link
              key={s.id}
              to="/account/shipments/$id"
              params={{ id: s.id }}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-card p-4 shadow-card transition-colors hover:border-teal/40"
            >
              <div>
                <p className="font-mono text-sm">{s.trackingNumber}</p>
                <p className="text-sm text-mist">
                  {s.sender.city} → {s.recipient.city} · {formatDate(s.createdAt)}
                  {s.isDemo ? " · DEMO" : ""}
                </p>
              </div>
              <StatusBadge status={s.status} />
            </Link>
          ))
        )}
      </div>
    </DashShell>
  );
}
