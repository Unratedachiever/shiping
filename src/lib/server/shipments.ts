import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { optionalAuthMiddleware } from "./optional-auth";
import { mapShipment, type EventRow, type ShipmentRow } from "./map";
import { dispatchNotification } from "./notify";
import { generateTrackingNumber, newId, rateLimit } from "@/lib/utils";
import { computeQuoteForService } from "@/lib/pricing";
import { SERVICES, type ServiceCode } from "@/lib/cities";
import { isShipmentStatus, type ShipmentStatus } from "@/lib/status";
import type { Shipment } from "@/lib/types";

const addressSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(40),
  email: z.string().trim().email().or(z.literal("")),
  street: z.string().trim().min(3).max(200),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(1).max(80),
  postalCode: z.string().trim().min(3).max(20),
  country: z.string().trim().min(2).max(80),
});

const packageSchema = z.object({
  packageType: z.string().trim().min(2).max(40),
  weightLb: z.number().positive().max(2000),
  lengthIn: z.number().positive().max(120),
  widthIn: z.number().positive().max(120),
  heightIn: z.number().positive().max(120),
  description: z.string().trim().max(400),
  declaredValue: z.number().min(0).max(100000),
});

const createSchema = z.object({
  sender: addressSchema,
  recipient: addressSchema,
  pkg: packageSchema,
  service: z.enum(["standard", "express", "overnight", "international"]),
});

async function loadByTracking(tracking: string): Promise<Shipment | null> {
  const sql = await getSql();
  const rows = await sql<ShipmentRow>`
    select * from shipments where upper(tracking_number) = ${tracking.toUpperCase()} limit 1
  `;
  const row = rows[0];
  if (!row) return null;
  const events = await sql<EventRow>`
    select id, status, location, description, occurred_at
    from tracking_events
    where shipment_id = ${row.id}
    order by occurred_at asc
  `;
  return mapShipment(row, events);
}

async function loadById(id: string): Promise<Shipment | null> {
  const sql = await getSql();
  const rows = await sql<ShipmentRow>`select * from shipments where id = ${id} limit 1`;
  const row = rows[0];
  if (!row) return null;
  const events = await sql<EventRow>`
    select id, status, location, description, occurred_at
    from tracking_events
    where shipment_id = ${row.id}
    order by occurred_at asc
  `;
  return mapShipment(row, events);
}

export const trackShipment = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ trackingNumber: z.string().trim().min(4).max(24) }).parse(data))
  .handler(async ({ data }) => {
    const key = `track:${data.trackingNumber.toUpperCase()}`;
    if (!rateLimit(key, 30, 60_000)) {
      throw new Error("Too many tracking lookups. Please wait a moment.");
    }
    const shipment = await loadByTracking(data.trackingNumber);
    if (!shipment) {
      throw new Error("No shipment matches that tracking number.");
    }
    return shipment;
  });

export const createShipment = createServerFn({ method: "POST" })
  .middleware([optionalAuthMiddleware])
  .validator((data: unknown) => createSchema.parse(data))
  .handler(async ({ data, context }) => {
    const origin = `${data.sender.city}, ${data.sender.state}`;
    const destination = `${data.recipient.city}, ${data.recipient.state}`;
    const quote = computeQuoteForService({
      origin,
      destination,
      weightLb: data.pkg.weightLb,
      lengthIn: data.pkg.lengthIn,
      widthIn: data.pkg.widthIn,
      heightIn: data.pkg.heightIn,
      service: data.service,
    });
    const sql = await getSql();
    let tracking = generateTrackingNumber();
    for (let i = 0; i < 6; i += 1) {
      const existing = await sql<{ id: string }>`select id from shipments where tracking_number = ${tracking} limit 1`;
      if (existing.length === 0) break;
      tracking = generateTrackingNumber();
    }
    const id = newId("shp");
    const userId = context.userId;
    const location = origin;
    await sql`
      insert into shipments (
        id, tracking_number, user_id, status, service_code,
        sender_name, sender_phone, sender_email, sender_street, sender_city, sender_state, sender_postal, sender_country,
        recipient_name, recipient_phone, recipient_email, recipient_street, recipient_city, recipient_state, recipient_postal, recipient_country,
        package_type, weight_lb, length_in, width_in, height_in, description, declared_value,
        current_location, estimated_delivery, subtotal, tax, fees, total, payment_status
      ) values (
        ${id}, ${tracking}, ${userId}, ${"label_created"}, ${data.service},
        ${data.sender.fullName}, ${data.sender.phone}, ${data.sender.email || null},
        ${data.sender.street}, ${data.sender.city}, ${data.sender.state}, ${data.sender.postalCode}, ${data.sender.country},
        ${data.recipient.fullName}, ${data.recipient.phone}, ${data.recipient.email || null},
        ${data.recipient.street}, ${data.recipient.city}, ${data.recipient.state}, ${data.recipient.postalCode}, ${data.recipient.country},
        ${data.pkg.packageType}, ${data.pkg.weightLb}, ${data.pkg.lengthIn}, ${data.pkg.widthIn}, ${data.pkg.heightIn},
        ${data.pkg.description || null}, ${data.pkg.declaredValue},
        ${location}, ${quote.estimatedDelivery}, ${quote.subtotal}, ${quote.tax}, ${quote.fees}, ${quote.total}, ${"pending"}
      )
    `;
    await sql`
      insert into tracking_events (id, shipment_id, status, location, description, occurred_at)
      values (
        ${newId("ev")}, ${id}, ${"label_created"}, ${location},
        ${"Shipment created. Label generated. Awaiting pickup."},
        now()
      )
    `;
    await dispatchNotification({
      userId,
      shipmentId: id,
      trackingNumber: tracking,
      status: "label_created",
    });
    const shipment = await loadById(id);
    if (!shipment) throw new Error("Shipment was created but could not be loaded.");
    return { shipment, quote };
  });

export const listMyShipments = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<ShipmentRow>`
      select * from shipments
      where user_id = ${context.userId}
      order by created_at desc
    `;
    return rows.map((r) => mapShipment(r));
  });

export const getMyShipment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ context, data }) => {
    const shipment = await loadById(data.id);
    if (!shipment || shipment.userId !== context.userId) {
      throw new Error("Shipment not found.");
    }
    return shipment;
  });

export { loadById, loadByTracking, SERVICES };
export type { ServiceCode };
