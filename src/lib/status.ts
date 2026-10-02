export const SHIPMENT_STATUSES = [
  "label_created",
  "pickup_scheduled",
  "picked_up",
  "processing",
  "departed",
  "in_transit",
  "arrived_facility",
  "customs_clearance",
  "delayed",
  "out_for_delivery",
  "delivered",
  "exception",
] as const;

export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export const TIMELINE_STEPS = [
  { key: "label_created", label: "Shipment Created" },
  { key: "picked_up", label: "Picked Up" },
  { key: "processing", label: "Processing" },
  { key: "departed", label: "Departed Facility" },
  { key: "in_transit", label: "In Transit" },
  { key: "arrived_facility", label: "Arrived at Destination Facility" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
] as const;

export type TimelineKey = (typeof TIMELINE_STEPS)[number]["key"];

const STATUS_TO_STEP: Record<ShipmentStatus, number> = {
  label_created: 0,
  pickup_scheduled: 0,
  picked_up: 1,
  processing: 2,
  departed: 3,
  in_transit: 4,
  arrived_facility: 5,
  customs_clearance: 5,
  delayed: 4,
  out_for_delivery: 6,
  delivered: 7,
  exception: 4,
};

export type StatusTone = "neutral" | "info" | "progress" | "success" | "warning" | "danger";

export const STATUS_META: Record<
  ShipmentStatus,
  { label: string; tone: StatusTone; description: string }
> = {
  label_created: {
    label: "Label Created",
    tone: "neutral",
    description: "Shipping label generated. Awaiting pickup.",
  },
  pickup_scheduled: {
    label: "Pickup Scheduled",
    tone: "info",
    description: "A courier is scheduled to collect this package.",
  },
  picked_up: {
    label: "Picked Up",
    tone: "progress",
    description: "Package collected from the sender.",
  },
  processing: {
    label: "Processing",
    tone: "progress",
    description: "Package is being sorted at a SwiftShip facility.",
  },
  departed: {
    label: "Departed Facility",
    tone: "progress",
    description: "Package has left the origin facility.",
  },
  in_transit: {
    label: "In Transit",
    tone: "progress",
    description: "Package is moving through the SwiftShip network.",
  },
  arrived_facility: {
    label: "Arrived at Facility",
    tone: "info",
    description: "Package arrived at a destination-area facility.",
  },
  customs_clearance: {
    label: "Customs Clearance",
    tone: "info",
    description: "International shipment is clearing customs.",
  },
  delayed: {
    label: "Delayed",
    tone: "warning",
    description: "Delivery is running behind the original estimate.",
  },
  out_for_delivery: {
    label: "Out for Delivery",
    tone: "info",
    description: "Package is on a vehicle for final delivery today.",
  },
  delivered: {
    label: "Delivered",
    tone: "success",
    description: "Package was delivered to the recipient.",
  },
  exception: {
    label: "Exception",
    tone: "danger",
    description: "An issue requires attention before delivery can continue.",
  },
};

export function isShipmentStatus(value: string): value is ShipmentStatus {
  return (SHIPMENT_STATUSES as readonly string[]).includes(value);
}

export function timelineIndex(status: ShipmentStatus): number {
  return STATUS_TO_STEP[status] ?? 0;
}

export function notificationForStatus(status: ShipmentStatus, tracking: string) {
  const map: Partial<Record<ShipmentStatus, { type: string; title: string; body: string }>> = {
    label_created: {
      type: "shipment_created",
      title: "Shipment created",
      body: `Label created for ${tracking}. We’ll notify you when it’s picked up.`,
    },
    picked_up: {
      type: "picked_up",
      title: "Package picked up",
      body: `${tracking} is now in the SwiftShip network.`,
    },
    departed: {
      type: "departed",
      title: "Shipment departed",
      body: `${tracking} has left the origin facility.`,
    },
    arrived_facility: {
      type: "arrived",
      title: "Arrived at facility",
      body: `${tracking} arrived at a destination-area facility.`,
    },
    delayed: {
      type: "delayed",
      title: "Shipment delayed",
      body: `${tracking} is running behind schedule. We’re working to recover the delay.`,
    },
    out_for_delivery: {
      type: "out_for_delivery",
      title: "Out for delivery",
      body: `${tracking} is out for delivery today.`,
    },
    delivered: {
      type: "delivered",
      title: "Package delivered",
      body: `${tracking} has been delivered.`,
    },
    exception: {
      type: "exception",
      title: "Delivery exception",
      body: `${tracking} needs attention. Open tracking for details.`,
    },
  };
  return map[status] ?? null;
}
