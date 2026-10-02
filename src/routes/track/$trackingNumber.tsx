import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Link2, Printer, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Page, Container } from "@/components/layout/page";
import { TrackingForm } from "@/components/tracking-form";
import { StatusBadge } from "@/components/status-badge";
import { EventLog, TrackingTimeline } from "@/components/tracking-timeline";
import { RouteMap } from "@/components/route-map";
import { PackingSlipSheet } from "@/components/packing-slip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trackShipment } from "@/lib/server/shipments";
import { STATUS_META } from "@/lib/status";
import { SERVICES } from "@/lib/cities";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { Shipment } from "@/lib/types";

export const Route = createFileRoute("/track/$trackingNumber")({
  component: TrackDetail,
});

function TrackDetail() {
  const { trackingNumber } = Route.useParams();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await trackShipment({ data: { trackingNumber } });
        if (!cancelled) {
          setShipment(data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setShipment(null);
          setError(e instanceof Error ? e.message : "Unable to load tracking.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    setLoading(true);
    void load();
    const timer = window.setInterval(() => {
      void trackShipment({ data: { trackingNumber } })
        .then((data) => {
          if (!cancelled) {
            setShipment(data);
            setError(null);
          }
        })
        .catch(() => undefined);
    }, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [trackingNumber]);

  const svc =
    shipment && shipment.serviceCode in SERVICES
      ? SERVICES[shipment.serviceCode as keyof typeof SERVICES]
      : null;

  async function shareLink() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: `Track ${trackingNumber}`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Tracking link copied.");
    } catch {
      toast.message(url);
    }
  }

  return (
    <Page>
      <section className="border-b border-line bg-navy text-paper no-print">
        <Container className="py-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-2">Tracking</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
            {loading ? "Looking up shipment…" : shipment ? shipment.trackingNumber : "Not found"}
          </h1>
          <div className="mt-6 max-w-xl">
            <TrackingForm variant="hero" initial={trackingNumber} />
          </div>
        </Container>
      </section>
      <Container className="py-10">
        {loading ? (
          <div className="grid gap-4 lg:grid-cols-3">
            <Skeleton className="h-64 lg:col-span-2" />
            <Skeleton className="h-64" />
          </div>
        ) : error ? (
          <Card className="rounded-xl">
            <CardContent className="p-8 text-center">
              <p className="font-display text-xl font-semibold">We couldn’t find that shipment</p>
              <p className="mt-2 text-sm text-mist">{error}</p>
              <p className="mt-4 text-sm text-mist">
                Double-check the number on your label, or{" "}
                <Link to="/contact" className="text-teal">
                  contact the desk
                </Link>{" "}
                if you still cannot find the shipment.
              </p>
            </CardContent>
          </Card>
        ) : shipment ? (
          <>
            <div className="no-print mb-4 flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => void shareLink()}>
                <Share2 className="size-4" /> Share
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  await navigator.clipboard.writeText(window.location.href);
                  toast.success("Link copied.");
                }}
              >
                <Link2 className="size-4" /> Copy link
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="size-4" /> Print
              </Button>
            </div>
            {shipment.isDemo ? (
              <p className="no-print mb-4 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
                This is a <strong>DEMO</strong> shipment seeded for product demos — not a live customer booking.
              </p>
            ) : null}
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <Card className="rounded-xl shadow-card">
                  <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle>Shipment status</CardTitle>
                      <p className="mt-1 text-sm text-mist">{STATUS_META[shipment.status].description}</p>
                      {shipment.exceptionReason ? (
                        <p className="mt-2 text-sm text-danger">Exception: {shipment.exceptionReason}</p>
                      ) : null}
                    </div>
                    <StatusBadge status={shipment.status} />
                  </CardHeader>
                  <CardContent>
                    <RouteMap
                      originCity={shipment.sender.city}
                      originState={shipment.sender.state}
                      destCity={shipment.recipient.city}
                      destState={shipment.recipient.state}
                      status={shipment.status}
                      currentLocation={shipment.currentLocation}
                      className="h-56 sm:h-72"
                    />
                    <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                      <Info label="Origin" value={`${shipment.sender.city}, ${shipment.sender.state}`} />
                      <Info label="Destination" value={`${shipment.recipient.city}, ${shipment.recipient.state}`} />
                      <Info label="Current location" value={shipment.currentLocation ?? "—"} />
                      <Info label="Estimated delivery" value={formatDate(shipment.estimatedDelivery)} />
                      <Info label="Service" value={svc?.name ?? shipment.serviceCode} />
                      <Info label="Shipment type" value={shipment.package.packageType} />
                      <Info label="Weight" value={`${shipment.package.weightLb} lb`} />
                      <Info label="Last updated" value={formatDateTime(shipment.lastUpdated)} />
                    </dl>
                  </CardContent>
                </Card>
                <Card className="rounded-xl shadow-card">
                  <CardHeader>
                    <CardTitle>Tracking history</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <EventLog events={shipment.events} />
                  </CardContent>
                </Card>
              </div>
              <div className="space-y-6">
                <Card className="rounded-xl shadow-card">
                  <CardHeader>
                    <CardTitle>Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TrackingTimeline status={shipment.status} events={shipment.events} />
                  </CardContent>
                </Card>
                <Card className="rounded-xl shadow-card">
                  <CardHeader>
                    <CardTitle>Parties</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-mist">Sender</p>
                      <p className="mt-1 font-medium">{shipment.sender.fullName}</p>
                      <p className="text-mist">
                        {shipment.sender.street}, {shipment.sender.city}, {shipment.sender.state} {shipment.sender.postalCode}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-mist">Recipient</p>
                      <p className="mt-1 font-medium">{shipment.recipient.fullName}</p>
                      <p className="text-mist">
                        {shipment.recipient.street}, {shipment.recipient.city}, {shipment.recipient.state}{" "}
                        {shipment.recipient.postalCode}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            <PackingSlipSheet shipment={shipment} />
          </>
        ) : null}
      </Container>
    </Page>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-mist">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}
