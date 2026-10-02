import { num } from "@/lib/utils";
import type { Shipment, TrackingEvent, AddressInput, PackageInput } from "@/lib/types";
import type { ShipmentStatus } from "@/lib/status";
import { isShipmentStatus } from "@/lib/status";

export type ShipmentRow = {
  id: string;
  tracking_number: string;
  user_id: string | null;
  status: string;
  service_code: string;
  sender_name: string;
  sender_phone: string | null;
  sender_email: string | null;
  sender_street: string;
  sender_city: string;
  sender_state: string;
  sender_postal: string;
  sender_country: string;
  recipient_name: string;
  recipient_phone: string | null;
  recipient_email: string | null;
  recipient_street: string;
  recipient_city: string;
  recipient_state: string;
  recipient_postal: string;
  recipient_country: string;
  package_type: string;
  weight_lb: unknown;
  length_in: unknown;
  width_in: unknown;
  height_in: unknown;
  description: string | null;
  declared_value: unknown;
  current_location: string | null;
  estimated_delivery: string | null;
  subtotal: unknown;
  tax: unknown;
  fees: unknown;
  total: unknown;
  payment_status: string;
  payment_method: string | null;
  is_demo: boolean;
  last_updated: string;
  created_at: string;
  internal_notes?: string | null;
  hold_location_id?: string | null;
  exception_reason?: string | null;
};

export type EventRow = {
  id: string;
  status: string;
  location: string;
  description: string;
  occurred_at: string;
};

function iso(value: unknown): string {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function addr(
  name: string,
  phone: string | null,
  email: string | null,
  street: string,
  city: string,
  state: string,
  postal: string,
  country: string,
): AddressInput {
  return {
    fullName: name,
    phone: phone ?? "",
    email: email ?? "",
    street,
    city,
    state,
    postalCode: postal,
    country,
  };
}

function pkg(row: ShipmentRow): PackageInput {
  return {
    packageType: row.package_type,
    weightLb: num(row.weight_lb),
    lengthIn: num(row.length_in),
    widthIn: num(row.width_in),
    heightIn: num(row.height_in),
    description: row.description ?? "",
    declaredValue: num(row.declared_value),
  };
}

export function mapEvent(row: EventRow): TrackingEvent {
  const status: ShipmentStatus = isShipmentStatus(row.status) ? row.status : "in_transit";
  return {
    id: row.id,
    status,
    location: row.location,
    description: row.description,
    occurredAt: iso(row.occurred_at),
  };
}

export function mapShipment(row: ShipmentRow, events: EventRow[] = []): Shipment {
  const status: ShipmentStatus = isShipmentStatus(row.status) ? row.status : "label_created";
  return {
    id: row.id,
    trackingNumber: row.tracking_number,
    userId: row.user_id,
    status,
    serviceCode: row.service_code,
    sender: addr(
      row.sender_name,
      row.sender_phone,
      row.sender_email,
      row.sender_street,
      row.sender_city,
      row.sender_state,
      row.sender_postal,
      row.sender_country,
    ),
    recipient: addr(
      row.recipient_name,
      row.recipient_phone,
      row.recipient_email,
      row.recipient_street,
      row.recipient_city,
      row.recipient_state,
      row.recipient_postal,
      row.recipient_country,
    ),
    package: pkg(row),
    currentLocation: row.current_location,
    estimatedDelivery: row.estimated_delivery,
    subtotal: num(row.subtotal),
    tax: num(row.tax),
    fees: num(row.fees),
    total: num(row.total),
    paymentStatus: row.payment_status,
    paymentMethod: row.payment_method,
    isDemo: Boolean(row.is_demo),
    lastUpdated: iso(row.last_updated),
    createdAt: iso(row.created_at),
    events: events.map(mapEvent),
    internalNotes: row.internal_notes ?? null,
    holdLocationId: row.hold_location_id ?? null,
    exceptionReason: row.exception_reason ?? null,
  };
}
