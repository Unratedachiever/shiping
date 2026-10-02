import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminShell } from "@/components/layout/admin-guard";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select";
import { adminBulkUpdateStatus, adminDeleteShipment, adminSearchShipments } from "@/lib/server/admin";
import { SERVICES } from "@/lib/cities";
import { SHIPMENT_STATUSES, type ShipmentStatus } from "@/lib/status";
import { formatDateTime, money } from "@/lib/utils";
import { toast } from "sonner";
import type { Shipment } from "@/lib/types";

export const Route = createFileRoute("/admin/shipments")({ component: AdminShipments });

function AdminShipments() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState<Shipment[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<ShipmentStatus>("in_transit");

  function reload(nextQ = q, nextStatus = status) {
    void adminSearchShipments({ data: { q: nextQ, status: nextStatus || undefined } }).then((r) => {
      setRows(r);
      setSelected(new Set());
    });
  }
  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (!rows) return;
    if (selected.size === rows.length) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.id)));
  }

  return (
    <AdminShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Shipments</h1>
          <p className="mt-1 text-sm text-mist">Search, filter, bulk-update scans, or open a detail wizard.</p>
        </div>
        <Button asChild>
          <Link to="/admin/create">Create shipment</Link>
        </Button>
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="Search tracking, names, cities"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            reload(e.target.value, status);
          }}
          aria-label="Search shipments"
        />
        <NativeSelect
          className="sm:w-52"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            reload(q, e.target.value);
          }}
          aria-label="Filter status"
        >
          <option value="">All statuses</option>
          {SHIPMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replaceAll("_", " ")}
            </option>
          ))}
        </NativeSelect>
      </div>
      {selected.size > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-line bg-accent/40 px-3 py-2">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <NativeSelect
            className="sm:w-48"
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value as ShipmentStatus)}
          >
            {SHIPMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replaceAll("_", " ")}
              </option>
            ))}
          </NativeSelect>
          <Button
            size="sm"
            onClick={() => {
              void adminBulkUpdateStatus({
                data: { ids: [...selected], status: bulkStatus },
              })
                .then((r) => {
                  toast.success(`Updated ${r.updated} shipment(s).`);
                  reload();
                })
                .catch((e) => toast.error(e instanceof Error ? e.message : "Bulk update failed."));
            }}
          >
            Apply status
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            Clear
          </Button>
        </div>
      ) : null}
      <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-card shadow-card">
        <table className="data-table min-w-[920px]">
          <thead>
            <tr>
              <th className="w-10">
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={!!rows?.length && selected.size === rows.length}
                  onChange={toggleAll}
                />
              </th>
              <th>Tracking</th>
              <th>Route</th>
              <th>Service</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Updated</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((s) => (
              <tr key={s.id}>
                <td>
                  <input
                    type="checkbox"
                    aria-label={`Select ${s.trackingNumber}`}
                    checked={selected.has(s.id)}
                    onChange={() => toggle(s.id)}
                  />
                </td>
                <td className="font-mono text-xs">
                  {s.trackingNumber}
                  {s.isDemo ? <span className="ml-1 text-warning">DEMO</span> : null}
                </td>
                <td>
                  <p>
                    {s.sender.city} → {s.recipient.city}
                  </p>
                  <p className="text-xs text-mist">{s.currentLocation ?? "—"}</p>
                </td>
                <td>
                  {s.serviceCode in SERVICES ? SERVICES[s.serviceCode as keyof typeof SERVICES].name : s.serviceCode}
                </td>
                <td>
                  <StatusBadge status={s.status} />
                </td>
                <td>
                  <span className="capitalize">{s.paymentStatus}</span>
                  <span className="block text-xs text-mist">{money(s.total)}</span>
                </td>
                <td className="text-mist">{formatDateTime(s.lastUpdated)}</td>
                <td className="text-right">
                  <Link to="/admin/shipments/$id" params={{ id: s.id }} className="text-teal">
                    Update
                  </Link>
                  <button
                    type="button"
                    className="ml-3 text-danger"
                    onClick={() => {
                      if (!confirm("Delete this shipment?")) return;
                      void adminDeleteShipment({ data: { id: s.id } })
                        .then(() => {
                          toast.success("Deleted.");
                          reload();
                        })
                        .catch((e) => toast.error(e instanceof Error ? e.message : "Delete failed."));
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows && rows.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No shipments match" description="Adjust filters or create a shipment." />
          </div>
        ) : null}
      </div>
    </AdminShell>
  );
}
