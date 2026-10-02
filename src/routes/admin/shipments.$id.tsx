import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { AdminShell } from "@/components/layout/admin-guard";
import { StatusBadge } from "@/components/status-badge";
import { EventLog } from "@/components/tracking-timeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/select";
import { Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { adminGetShipment, adminUpdateShipment } from "@/lib/server/admin";
import { SERVICES } from "@/lib/cities";
import { SHIPMENT_STATUSES, STATUS_META, type ShipmentStatus } from "@/lib/status";
import { formatDate, money } from "@/lib/utils";
import type { Shipment } from "@/lib/types";

export const Route = createFileRoute("/admin/shipments/$id")({ component: AdminShipmentDetail });

const WIZARD: { status: ShipmentStatus; label: string; note: string }[] = [
  { status: "picked_up", label: "Picked up", note: "Package collected from sender." },
  { status: "processing", label: "Processing", note: "Sorted at origin facility." },
  { status: "departed", label: "Departed", note: "Departed origin facility." },
  { status: "in_transit", label: "In transit", note: "Moving through the network." },
  { status: "arrived_facility", label: "Arrived facility", note: "Arrived at destination facility." },
  { status: "out_for_delivery", label: "Out for delivery", note: "Out for delivery." },
  { status: "delivered", label: "Delivered", note: "Delivered to recipient." },
];

function AdminShipmentDetail() {
  const { id } = Route.useParams();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [status, setStatus] = useState<ShipmentStatus>("in_transit");
  const [location, setLocation] = useState("");
  const [edd, setEdd] = useState("");
  const [note, setNote] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [exceptionReason, setExceptionReason] = useState("");

  function apply(s: Shipment) {
    setShipment(s);
    setStatus(s.status);
    setLocation(s.currentLocation ?? "");
    setEdd((s.estimatedDelivery ?? "").slice(0, 10));
    setInternalNotes(s.internalNotes ?? "");
    setExceptionReason(s.exceptionReason ?? "");
  }

  useEffect(() => {
    void adminGetShipment({ data: { id } }).then(apply);
  }, [id]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const next = await adminUpdateShipment({
        data: {
          id,
          status,
          currentLocation: location,
          estimatedDelivery: edd,
          eventNote: note || undefined,
          internalNotes: internalNotes || undefined,
          exceptionReason: exceptionReason || undefined,
        },
      });
      apply(next);
      setNote("");
      toast.success("Shipment updated. Tracking pages refresh within a few seconds.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed.");
    }
  }

  async function advance(step: (typeof WIZARD)[number]) {
    setStatus(step.status);
    setNote(step.note);
    try {
      const next = await adminUpdateShipment({
        data: {
          id,
          status: step.status,
          currentLocation: location || undefined,
          estimatedDelivery: edd || undefined,
          eventNote: step.note,
        },
      });
      apply(next);
      setNote("");
      toast.success(`Advanced to ${STATUS_META[step.status].label}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed.");
    }
  }

  if (!shipment) {
    return (
      <AdminShell>
        <Skeleton className="h-64" />
      </AdminShell>
    );
  }

  const svc = shipment.serviceCode in SERVICES ? SERVICES[shipment.serviceCode as keyof typeof SERVICES] : null;

  return (
    <AdminShell>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-mist">
            <Link to="/admin/shipments" className="hover:text-teal">
              Shipments
            </Link>{" "}
            / {shipment.trackingNumber}
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold">
            {shipment.trackingNumber}
            {shipment.isDemo ? <span className="ml-2 text-sm text-warning">DEMO</span> : null}
          </h1>
          <p className="text-sm text-mist">
            {shipment.sender.fullName} → {shipment.recipient.fullName}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={shipment.status} />
          <Button asChild variant="outline" size="sm">
            <Link to="/track/$trackingNumber" params={{ trackingNumber: shipment.trackingNumber }}>
              Public tracking
            </Link>
          </Button>
        </div>
      </div>

      <Card className="mt-4 rounded-xl">
        <CardHeader>
          <CardTitle>Status advance wizard</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {WIZARD.map((step) => (
            <Button key={step.status} type="button" variant="outline" size="sm" onClick={() => void advance(step)}>
              {step.label}
            </Button>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setStatus("delayed");
              setExceptionReason("Operational delay");
              setNote("Delay posted by operations.");
            }}
          >
            Mark delayed
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setStatus("exception");
              setExceptionReason("Address / access issue");
              setNote("Exception — requires attention.");
            }}
          >
            Mark exception
          </Button>
        </CardContent>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Post a scan</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <NativeSelect value={status} onChange={(e) => setStatus(e.target.value as ShipmentStatus)}>
                  {SHIPMENT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replaceAll("_", " ")}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="space-y-1.5">
                <Label>Current location</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Dallas Inland Hub" />
              </div>
              <div className="space-y-1.5">
                <Label>Estimated delivery</Label>
                <Input type="date" value={edd} onChange={(e) => setEdd(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Exception reason</Label>
                <Input
                  value={exceptionReason}
                  onChange={(e) => setExceptionReason(e.target.value)}
                  placeholder="Optional — shown on tracking when set"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tracking event note</Label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Optional scan description posted to the public timeline"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Internal notes (staff only)</Label>
                <Textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Not shown on public tracking"
                />
              </div>
              <Button type="submit">Save update</Button>
            </form>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent>
            {shipment.events.length === 0 ? (
              <p className="text-sm text-mist">No scans yet.</p>
            ) : (
              <EventLog events={shipment.events} />
            )}
          </CardContent>
        </Card>
        <Card className="rounded-xl lg:col-span-2">
          <CardHeader>
            <CardTitle>Parties & service</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
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
            <p>
              <span className="text-mist">Service · </span>
              {svc?.name ?? shipment.serviceCode}
            </p>
            <p>
              <span className="text-mist">Package · </span>
              {shipment.package.packageType} · {shipment.package.weightLb} lb
            </p>
            <p>
              <span className="text-mist">ETA · </span>
              {formatDate(shipment.estimatedDelivery)}
            </p>
            <p>
              <span className="text-mist">Payment · </span>
              <span className="capitalize">{shipment.paymentStatus}</span> · {money(shipment.total)}
            </p>
            {shipment.userId ? (
              <p>
                <span className="text-mist">Customer · </span>
                <Link to="/admin/customers/$userId" params={{ userId: shipment.userId }} className="text-teal">
                  View account
                </Link>
              </p>
            ) : (
              <p className="text-mist">Guest checkout (no linked account)</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
