import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  DollarSign,
  Inbox,
  Package,
  Sparkles,
  Truck,
  Users,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { AdminShell } from "@/components/layout/admin-guard";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { adminSeedDemoShipments, getAdminStats } from "@/lib/server/admin";
import { formatDateTime, money } from "@/lib/utils";
import type { AdminStats, Shipment } from "@/lib/types";

export const Route = createFileRoute("/admin/")({ component: AdminHome });

function AdminHome() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  function reload() {
    void getAdminStats()
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : "Unable to load stats."));
  }

  useEffect(() => {
    reload();
  }, []);

  return (
    <AdminShell>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Operations console</h1>
          <p className="mt-1 text-sm text-mist">Live network picture, exceptions, and the next scan to post.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/admin/create">Create shipment</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/admin/shipments">All shipments</Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={seeding}
            onClick={() => {
              if (!confirm("Create clearly labeled DEMO in-transit shipments with scan events?")) return;
              setSeeding(true);
              void adminSeedDemoShipments()
                .then((r) => {
                  toast.success(`Seeded ${r.created.length} DEMO shipments.`);
                  reload();
                })
                .catch((e) => toast.error(e instanceof Error ? e.message : "Seed failed."))
                .finally(() => setSeeding(false));
            }}
          >
            <Sparkles className="size-4" />
            {seeding ? "Seeding…" : "Seed DEMO shipments"}
          </Button>
        </div>
      </div>
      <p className="mt-2 text-xs text-mist">
        Demo seed creates sample bookings flagged <code className="rounded bg-paper-2 px-1">is_demo</code> — never
        presented as live carrier traffic.
      </p>
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      {!stats ? (
        <Skeleton className="mt-6 h-64" />
      ) : (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat icon={Package} label="Shipments today" value={String(stats.today)} />
            <Stat icon={Truck} label="In transit" value={String(stats.inTransit)} />
            <Stat icon={AlertTriangle} label="Exceptions / delayed" value={String(stats.delayed)} warn={stats.delayed > 0} />
            <Stat icon={DollarSign} label="Collected revenue" value={money(stats.revenue)} />
            <Stat icon={Clock} label="Out for delivery" value={String(stats.outForDelivery)} />
            <Stat icon={Package} label="Awaiting pickup" value={String(stats.pending)} />
            <Stat icon={Users} label="Customer accounts" value={String(stats.customers)} />
            <Stat icon={Inbox} label="Open inbox" value={String(stats.openMessages ?? stats.messages)} />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <Card className="rounded-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Needs attention</CardTitle>
                <Link to="/admin/shipments" className="text-sm text-teal">
                  View all
                </Link>
              </CardHeader>
              <CardContent>
                {stats.attention.length === 0 ? (
                  <p className="text-sm text-mist">No delayed, exception, or last-mile shipments right now.</p>
                ) : (
                  <ul className="divide-y divide-line">
                    {stats.attention.map((s) => (
                      <ShipmentRow key={s.id} shipment={s} />
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
            <Card className="rounded-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Latest activity</CardTitle>
                <Link to="/admin/activity" className="text-sm text-teal">
                  Activity log
                </Link>
              </CardHeader>
              <CardContent>
                {stats.recent.length === 0 ? (
                  <p className="text-sm text-mist">No shipments yet. Create one or seed DEMO data.</p>
                ) : (
                  <ul className="divide-y divide-line">
                    {stats.recent.map((s) => (
                      <ShipmentRow key={s.id} shipment={s} />
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4 rounded-xl">
            <CardContent className="p-5">
              <p className="text-sm font-medium">Shipment activity (14 days)</p>
              {stats.activity.length === 0 ? (
                <p className="mt-4 text-sm text-mist">Activity appears here as labels are created.</p>
              ) : (
                <div className="mt-4 h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.activity}>
                      <CartesianGrid stroke="var(--color-line)" strokeDasharray="3 3" />
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--color-mist)" }} />
                      <YAxis tick={{ fontSize: 11, fill: "var(--color-mist)" }} allowDecimals={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="count" stroke="var(--color-teal)" fill="var(--color-accent)" name="Shipments" />
                      <Area type="monotone" dataKey="revenue" stroke="var(--color-navy)" fill="transparent" name="Revenue" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </AdminShell>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  warn,
}: {
  icon: typeof Package;
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <Card className="rounded-xl shadow-card">
      <CardContent className="flex items-start gap-3 p-4">
        <span className={`grid size-10 place-items-center rounded-md ${warn ? "bg-danger/10 text-danger" : "bg-accent text-teal"}`}>
          <Icon className="size-5" />
        </span>
        <div>
          <p className="font-display text-xl font-semibold tabular-nums">{value}</p>
          <p className="mt-0.5 text-xs text-mist">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ShipmentRow({ shipment: s }: { shipment: Shipment }) {
  return (
    <li>
      <Link to="/admin/shipments/$id" params={{ id: s.id }} className="flex items-center justify-between gap-3 py-3">
        <div className="min-w-0">
          <p className="font-mono text-xs font-medium">
            {s.trackingNumber}
            {s.isDemo ? " · DEMO" : ""}
          </p>
          <p className="mt-0.5 truncate text-sm text-mist">
            {s.sender.city} → {s.recipient.city}
            {s.currentLocation ? ` · ${s.currentLocation}` : ""}
          </p>
          <p className="mt-0.5 text-xs text-mist">{formatDateTime(s.lastUpdated)}</p>
        </div>
        <span className="flex shrink-0 items-center gap-2">
          <StatusBadge status={s.status} />
          <ArrowRight className="size-3.5 text-mist" />
        </span>
      </Link>
    </li>
  );
}
