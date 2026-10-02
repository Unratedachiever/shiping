import type { Shipment } from "@/lib/types";
import { SERVICES } from "@/lib/cities";
import { formatDate, money } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function PackingSlipActions({ shipment }: { shipment: Shipment }) {
  return (
    <div className="no-print flex flex-wrap gap-2">
      <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
        <Printer className="size-4" />
        Print label / packing slip
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={async () => {
          const url = `${window.location.origin}/track/${shipment.trackingNumber}`;
          try {
            await navigator.clipboard.writeText(url);
          } catch {
            // fallback
            window.prompt("Copy tracking link", url);
          }
        }}
      >
        Copy tracking link
      </Button>
    </div>
  );
}

export function PackingSlipSheet({ shipment }: { shipment: Shipment }) {
  const svc =
    shipment.serviceCode in SERVICES
      ? SERVICES[shipment.serviceCode as keyof typeof SERVICES]
      : null;
  return (
    <div className="print-sheet print-only mt-6 rounded-xl border border-line bg-card p-6 print:block print:border-black">
      <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
        <div>
          <p className="font-display text-xl font-semibold">SwiftShip Logistics</p>
          <p className="text-sm text-mist">Packing slip · not a live carrier waybill for third-party networks</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-lg font-semibold tracking-wide">{shipment.trackingNumber}</p>
          <p className="text-sm">{svc?.name ?? shipment.serviceCode}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-mist">From</p>
          <p className="mt-1 font-medium">{shipment.sender.fullName}</p>
          <p className="text-sm">
            {shipment.sender.street}
            <br />
            {shipment.sender.city}, {shipment.sender.state} {shipment.sender.postalCode}
            <br />
            {shipment.sender.country}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-mist">To</p>
          <p className="mt-1 font-medium">{shipment.recipient.fullName}</p>
          <p className="text-sm">
            {shipment.recipient.street}
            <br />
            {shipment.recipient.city}, {shipment.recipient.state} {shipment.recipient.postalCode}
            <br />
            {shipment.recipient.country}
          </p>
        </div>
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-mist">Weight</dt>
          <dd className="font-medium">{shipment.package.weightLb} lb</dd>
        </div>
        <div>
          <dt className="text-mist">Package</dt>
          <dd className="font-medium capitalize">{shipment.package.packageType}</dd>
        </div>
        <div>
          <dt className="text-mist">ETA</dt>
          <dd className="font-medium">{formatDate(shipment.estimatedDelivery)}</dd>
        </div>
        <div>
          <dt className="text-mist">Total paid</dt>
          <dd className="font-medium">{money(shipment.total)}</dd>
        </div>
      </dl>
      {shipment.package.description ? (
        <p className="mt-4 text-sm">
          <span className="text-mist">Contents · </span>
          {shipment.package.description}
        </p>
      ) : null}
      {shipment.isDemo ? (
        <p className="mt-4 rounded-md bg-warning/15 px-3 py-2 text-sm text-warning">DEMO shipment — sample data only.</p>
      ) : null}
    </div>
  );
}
