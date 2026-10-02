import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { DashShell, ACCOUNT_LINKS } from "@/components/layout/dash-shell";
import { StatusBadge } from "@/components/status-badge";
import { EventLog, TrackingTimeline } from "@/components/tracking-timeline";
import { RouteMap } from "@/components/route-map";
import { PackingSlipActions, PackingSlipSheet } from "@/components/packing-slip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getMyShipment } from "@/lib/server/shipments";
import { formatDate, money } from "@/lib/utils";
import type { Shipment } from "@/lib/types";

export const Route = createFileRoute("/account/shipments/$id")({ component: AccountShipmentDetail });

function AccountShipmentDetail() {
  const { id } = Route.useParams();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getMyShipment({ data: { id } });
        if (!cancelled) setShipment(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Not found");
      }
    }
    void load();
    const t = window.setInterval(() => {
      void getMyShipment({ data: { id } })
        .then((d) => {
          if (!cancelled) setShipment(d);
        })
        .catch(() => undefined);
    }, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [id]);

  return (
    <DashShell title="Account" links={ACCOUNT_LINKS}>
      {!shipment && !error ? <Skeleton className="h-64" /> : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {shipment ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-mist">
                <Link to="/account/shipments" className="hover:text-teal">
                  Shipments
                </Link>{" "}
                / {shipment.trackingNumber}
              </p>
              <h1 className="mt-1 font-display text-2xl font-semibold">{shipment.trackingNumber}</h1>
              <p className="text-sm text-mist">
                {shipment.sender.city} → {shipment.recipient.city} · ETA {formatDate(shipment.estimatedDelivery)} ·{" "}
                {money(shipment.total)}
              </p>
            </div>
            <StatusBadge status={shipment.status} />
          </div>
          <PackingSlipActions shipment={shipment} />
          {shipment.isDemo ? (
            <p className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
              DEMO shipment — sample data for demos only.
            </p>
          ) : null}
          <RouteMap
            originCity={shipment.sender.city}
            originState={shipment.sender.state}
            destCity={shipment.recipient.city}
            destState={shipment.recipient.state}
            status={shipment.status}
            currentLocation={shipment.currentLocation}
            className="h-52"
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle>Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <TrackingTimeline status={shipment.status} events={shipment.events} />
              </CardContent>
            </Card>
            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle>History</CardTitle>
              </CardHeader>
              <CardContent>
                <EventLog events={shipment.events} />
              </CardContent>
            </Card>
          </div>
          <PackingSlipSheet shipment={shipment} />
          <Link
            to="/track/$trackingNumber"
            params={{ trackingNumber: shipment.trackingNumber }}
            className="no-print text-sm text-teal"
          >
            Open public tracking page
          </Link>
        </div>
      ) : null}
    </DashShell>
  );
}
