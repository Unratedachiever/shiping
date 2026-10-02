import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { mapShipment, type EventRow, type ShipmentRow } from "./map";
import { dispatchNotification } from "./notify";
import { generateTrackingNumber, newId, num, toDateOnly } from "@/lib/utils";
import { isShipmentStatus, SHIPMENT_STATUSES, type ShipmentStatus } from "@/lib/status";
import { computeQuoteForService } from "@/lib/pricing";
import type { AdminActivity, AdminCustomerDetail, AdminPayment, AdminStats, ContactMessage, Facility, SavedAddress, Shipment } from "@/lib/types";

async function requireAdmin(userId: string) {
  const sql = await getSql();
  const rows = await sql<{ role: string }>`select role from profiles where user_id = ${userId} limit 1`;
  if (rows[0]?.role !== "admin") {
    throw new Error("Forbidden");
  }
}

async function logActivity(opts: {
  actorUserId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  meta?: unknown;
}) {
  try {
    const sql = await getSql();
    await sql`
      insert into admin_activity_log (id, actor_user_id, action, entity_type, entity_id, summary, meta_json)
      values (
        ${newId("act")}, ${opts.actorUserId}, ${opts.action}, ${opts.entityType},
        ${opts.entityId ?? null}, ${opts.summary},
        ${opts.meta ? JSON.stringify(opts.meta) : null}
      )
    `;
  } catch {
    // Table may not exist until migration 0005 runs; never block ops on audit write.
  }
}


async function loadFull(id: string): Promise<Shipment | null> {
  const sql = await getSql();
  const rows = await sql<ShipmentRow>`select * from shipments where id = ${id} limit 1`;
  const row = rows[0];
  if (!row) return null;
  const events = await sql<EventRow>`
    select id, status, location, description, occurred_at
    from tracking_events where shipment_id = ${row.id} order by occurred_at asc
  `;
  return mapShipment(row, events);
}

export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    const totals = await sql<{
      total: number;
      today: number;
      in_transit: number;
      delivered: number;
      delayed: number;
      pending: number;
      out_for_delivery: number;
      exceptions: number;
      unpaid: number;
      revenue: unknown;
      customers: number;
      messages: number;
      open_messages: number;
    }>`
      select
        count(*)::int as total,
        count(*) filter (where created_at::date = current_date)::int as today,
        count(*) filter (where status in ('picked_up','processing','departed','in_transit','arrived_facility','customs_clearance','out_for_delivery'))::int as in_transit,
        count(*) filter (where status = 'delivered')::int as delivered,
        count(*) filter (where status in ('delayed','exception'))::int as delayed,
        count(*) filter (where status in ('label_created','pickup_scheduled'))::int as pending,
        count(*) filter (where status = 'out_for_delivery')::int as out_for_delivery,
        count(*) filter (where status = 'exception')::int as exceptions,
        count(*) filter (where payment_status <> ${"completed"})::int as unpaid,
        coalesce(sum(total) filter (where payment_status = ${"completed"}), 0) as revenue,
        (select count(*)::int from profiles) as customers,
        (select count(*)::int from contact_messages) as messages,
        (select count(*)::int from contact_messages) as open_messages
      from shipments
    `;
    const activity = await sql<{ day: string; count: number; revenue: unknown }>`
      select to_char(created_at, 'YYYY-MM-DD') as day,
             count(*)::int as count,
             coalesce(sum(total), 0) as revenue
      from shipments
      where created_at > now() - interval '14 days'
      group by 1
      order by 1
    `;
    const recentRows = await sql<ShipmentRow>`
      select * from shipments order by last_updated desc limit 8
    `;
    const attentionRows = await sql<ShipmentRow>`
      select * from shipments
      where status in (${"delayed"}, ${"exception"}, ${"out_for_delivery"})
      order by last_updated desc
      limit 12
    `;
    const t = totals[0];
    let openMessages = t?.open_messages ?? 0;
    try {
      const open = await sql<{ n: number }>`
        select count(*)::int as n from contact_messages where coalesce(status, 'open') = 'open'
      `;
      openMessages = open[0]?.n ?? openMessages;
    } catch {
      // status column arrives with migration 0005
    }
    const stats: AdminStats = {
      total: t?.total ?? 0,
      today: t?.today ?? 0,
      inTransit: t?.in_transit ?? 0,
      delivered: t?.delivered ?? 0,
      delayed: t?.delayed ?? 0,
      pending: t?.pending ?? 0,
      outForDelivery: t?.out_for_delivery ?? 0,
      exceptions: t?.exceptions ?? 0,
      unpaid: t?.unpaid ?? 0,
      revenue: num(t?.revenue),
      customers: t?.customers ?? 0,
      messages: t?.messages ?? 0,
      openMessages,
      activity: activity.map((a) => ({ day: a.day, count: a.count, revenue: num(a.revenue) })),
      recent: recentRows.map((r) => mapShipment(r)),
      attention: attentionRows.map((r) => mapShipment(r)),
    };
    return stats;
  });

export const adminSearchShipments = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) =>
    z
      .object({
        q: z.string().trim().max(80).optional(),
        status: z.string().trim().max(40).optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    const q = (data.q ?? "").toLowerCase();
    const status = data.status ?? "";
    const rows = await sql<ShipmentRow>`
      select * from shipments
      order by last_updated desc
      limit 200
    `;
    return rows
      .map((r) => mapShipment(r))
      .filter((s) => {
        if (status && s.status !== status) return false;
        if (!q) return true;
        const blob = `${s.trackingNumber} ${s.sender.fullName} ${s.recipient.fullName} ${s.sender.city} ${s.recipient.city}`.toLowerCase();
        return blob.includes(q);
      });
  });

export const adminGetShipment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const shipment = await loadFull(data.id);
    if (!shipment) throw new Error("Shipment not found.");
    return shipment;
  });

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

export const adminCreateShipment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) =>
    z
      .object({
        sender: addressSchema,
        recipient: addressSchema,
        packageType: z.string().min(2).max(40),
        weightLb: z.number().positive().max(2000),
        lengthIn: z.number().positive().max(120),
        widthIn: z.number().positive().max(120),
        heightIn: z.number().positive().max(120),
        description: z.string().max(400),
        declaredValue: z.number().min(0).max(100000),
        service: z.enum(["standard", "express", "overnight", "international"]),
        status: z.enum(SHIPMENT_STATUSES).optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const quote = computeQuoteForService({
      origin: `${data.sender.city}, ${data.sender.state}`,
      destination: `${data.recipient.city}, ${data.recipient.state}`,
      weightLb: data.weightLb,
      lengthIn: data.lengthIn,
      widthIn: data.widthIn,
      heightIn: data.heightIn,
      service: data.service,
    });
    const sql = await getSql();
    const id = newId("shp");
    const tracking = generateTrackingNumber();
    const status: ShipmentStatus = data.status ?? "label_created";
    const location = `${data.sender.city}, ${data.sender.state}`;
    await sql`
      insert into shipments (
        id, tracking_number, status, service_code,
        sender_name, sender_phone, sender_email, sender_street, sender_city, sender_state, sender_postal, sender_country,
        recipient_name, recipient_phone, recipient_email, recipient_street, recipient_city, recipient_state, recipient_postal, recipient_country,
        package_type, weight_lb, length_in, width_in, height_in, description, declared_value,
        current_location, estimated_delivery, subtotal, tax, fees, total, payment_status
      ) values (
        ${id}, ${tracking}, ${status}, ${data.service},
        ${data.sender.fullName}, ${data.sender.phone}, ${data.sender.email || null},
        ${data.sender.street}, ${data.sender.city}, ${data.sender.state}, ${data.sender.postalCode}, ${data.sender.country},
        ${data.recipient.fullName}, ${data.recipient.phone}, ${data.recipient.email || null},
        ${data.recipient.street}, ${data.recipient.city}, ${data.recipient.state}, ${data.recipient.postalCode}, ${data.recipient.country},
        ${data.packageType}, ${data.weightLb}, ${data.lengthIn}, ${data.widthIn}, ${data.heightIn},
        ${data.description || null}, ${data.declaredValue},
        ${location}, ${quote.estimatedDelivery}, ${quote.subtotal}, ${quote.tax}, ${quote.fees}, ${quote.total}, ${"completed"}
      )
    `;
    await sql`
      insert into tracking_events (id, shipment_id, status, location, description, occurred_at)
      values (${newId("ev")}, ${id}, ${status}, ${location}, ${"Shipment created by staff."}, now())
    `;
    const shipment = await loadFull(id);
    if (!shipment) throw new Error("Could not load created shipment.");
    return shipment;
  });

export const adminUpdateShipment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) =>
    z
      .object({
        id: z.string(),
        status: z.enum(SHIPMENT_STATUSES).optional(),
        currentLocation: z.string().trim().max(120).optional(),
        estimatedDelivery: z.string().trim().max(20).optional(),
        description: z.string().max(400).optional(),
        eventNote: z.string().trim().max(400).optional(),
        internalNotes: z.string().max(2000).optional(),
        exceptionReason: z.string().trim().max(400).optional(),
        holdLocationId: z.string().trim().max(64).optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const current = await loadFull(data.id);
    if (!current) throw new Error("Shipment not found.");
    const sql = await getSql();
    const status = data.status ?? current.status;
    const location = data.currentLocation ?? current.currentLocation ?? "";
    const edd = data.estimatedDelivery
      ? data.estimatedDelivery.slice(0, 10)
      : current.estimatedDelivery
        ? current.estimatedDelivery.slice(0, 10)
        : toDateOnly(new Date());
    try {
      await sql`
        update shipments set
          status = ${status},
          current_location = ${location || null},
          estimated_delivery = ${edd},
          description = coalesce(${data.description ?? null}, description),
          internal_notes = coalesce(${data.internalNotes ?? null}, internal_notes),
          exception_reason = coalesce(${data.exceptionReason ?? null}, exception_reason),
          hold_location_id = coalesce(${data.holdLocationId ?? null}, hold_location_id),
          last_updated = now()
        where id = ${data.id}
      `;
    } catch {
      await sql`
        update shipments set
          status = ${status},
          current_location = ${location || null},
          estimated_delivery = ${edd},
          description = coalesce(${data.description ?? null}, description),
          last_updated = now()
        where id = ${data.id}
      `;
    }
    await logActivity({
      actorUserId: context.userId,
      action: "shipment.update",
      entityType: "shipment",
      entityId: data.id,
      summary: data.status
        ? `Status → ${status.replaceAll("_", " ")} for ${current.trackingNumber}`
        : `Updated ${current.trackingNumber}`,
      meta: { status, location, exceptionReason: data.exceptionReason },
    });
    if (data.status || data.eventNote || data.currentLocation) {
      const note =
        data.eventNote ||
        (data.status ? `Status updated to ${status.replaceAll("_", " ")}.` : "Location updated.");
      await sql`
        insert into tracking_events (id, shipment_id, status, location, description, occurred_at)
        values (${newId("ev")}, ${data.id}, ${status}, ${location || current.currentLocation || "Network"}, ${note}, now())
      `;
    }
    if (data.status && isShipmentStatus(data.status)) {
      await dispatchNotification({
        userId: current.userId,
        shipmentId: current.id,
        trackingNumber: current.trackingNumber,
        status: data.status,
      });
    }
    const shipment = await loadFull(data.id);
    if (!shipment) throw new Error("Update failed.");
    return shipment;
  });

export const adminDeleteShipment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    await sql`delete from tracking_events where shipment_id = ${data.id}`;
    await sql`delete from payments where shipment_id = ${data.id}`;
    await sql`delete from shipments where id = ${data.id}`;
    return { ok: true };
  });

export const adminSearchCustomers = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => z.object({ q: z.string().trim().max(80).optional() }).parse(data))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    const q = (data.q ?? "").toLowerCase();
    const rows = await sql<{
      user_id: string;
      role: string;
      full_name: string | null;
      phone: string | null;
      company: string | null;
      created_at: string;
      shipments: number;
    }>`
      select p.user_id, p.role, p.full_name, p.phone, p.company, p.created_at,
             (select count(*)::int from shipments s where s.user_id = p.user_id) as shipments
      from profiles p
      order by p.created_at desc
    `;
    return rows
      .filter((r) => {
        if (!q) return true;
        return `${r.full_name ?? ""} ${r.phone ?? ""} ${r.company ?? ""} ${r.user_id}`.toLowerCase().includes(q);
      })
      .map((r) => ({
        userId: r.user_id,
        role: r.role,
        fullName: r.full_name,
        phone: r.phone,
        company: r.company,
        createdAt: r.created_at,
        shipments: r.shipments,
      }));
  });

export const adminSetRole = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) =>
    z.object({ userId: z.string(), role: z.enum(["customer", "admin"]) }).parse(data),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    if (data.userId === context.userId && data.role !== "admin") {
      throw new Error("You cannot remove your own staff access.");
    }
    const sql = await getSql();
    await sql`update profiles set role = ${data.role}, updated_at = now() where user_id = ${data.userId}`;
    return { ok: true };
  });

export const adminListPayments = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      shipment_id: string;
      tracking_number: string;
      method: string;
      status: string;
      provider: string;
      last4: string | null;
      total: unknown;
      created_at: string;
      sender_name: string;
      recipient_name: string;
    }>`
      select p.id, p.shipment_id, s.tracking_number, p.method, p.status, p.provider, p.last4, p.total, p.created_at,
             s.sender_name, s.recipient_name
      from payments p
      join shipments s on s.id = p.shipment_id
      order by p.created_at desc
      limit 200
    `;
    const list: AdminPayment[] = rows.map((r) => ({
      id: r.id,
      shipmentId: r.shipment_id,
      trackingNumber: r.tracking_number,
      method: r.method,
      status: r.status,
      provider: r.provider,
      last4: r.last4,
      total: num(r.total),
      createdAt: String(r.created_at),
      senderName: r.sender_name,
      recipientName: r.recipient_name,
    }));
    return list;
  });

export const adminListMessages = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      name: string;
      email: string;
      topic: string;
      message: string;
      created_at: string;
      status: string | null;
      staff_notes: string | null;
      resolved_at: string | null;
    }>`
      select id, name, email, topic, message, created_at,
             coalesce(status, 'open') as status, staff_notes, resolved_at
      from contact_messages
      order by created_at desc
      limit 200
    `;
    const list: ContactMessage[] = rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      topic: r.topic,
      message: r.message,
      createdAt: String(r.created_at),
      status: r.status ?? "open",
      staffNotes: r.staff_notes,
      resolvedAt: r.resolved_at ? String(r.resolved_at) : null,
    }));
    return list;
  });

export const adminDeleteMessage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    await sql`delete from contact_messages where id = ${data.id}`;
    return { ok: true };
  });

const facilitySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(120),
  type: z.enum(["distribution", "service", "pickup", "warehouse"]),
  street: z.string().trim().min(3).max(200),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(1).max(80),
  postalCode: z.string().trim().min(2).max(20),
  country: z.string().trim().min(2).max(80),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  phone: z.string().trim().max(40).optional(),
  hours: z.string().trim().max(120).optional(),
  services: z.string().trim().max(200).optional(),
});

export const adminUpsertLocation = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => facilitySchema.parse(data))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    const id = data.id || newId("loc");
    await sql`
      insert into facility_locations (
        id, name, type, street, city, state, postal_code, country, lat, lng, phone, hours, services
      ) values (
        ${id}, ${data.name}, ${data.type}, ${data.street}, ${data.city}, ${data.state}, ${data.postalCode},
        ${data.country}, ${data.lat}, ${data.lng}, ${data.phone || null}, ${data.hours || null}, ${data.services || null}
      )
      on conflict (id) do update set
        name = excluded.name,
        type = excluded.type,
        street = excluded.street,
        city = excluded.city,
        state = excluded.state,
        postal_code = excluded.postal_code,
        country = excluded.country,
        lat = excluded.lat,
        lng = excluded.lng,
        phone = excluded.phone,
        hours = excluded.hours,
        services = excluded.services
    `;
    return { id };
  });

export const adminDeleteLocation = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    await sql`delete from facility_locations where id = ${data.id}`;
    return { ok: true };
  });

export const adminListLocations = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      name: string;
      type: string;
      street: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
      lat: unknown;
      lng: unknown;
      phone: string | null;
      hours: string | null;
      services: string | null;
    }>`
      select * from facility_locations order by country, state, city, name
    `;
    const list: Facility[] = rows.map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      street: r.street,
      city: r.city,
      state: r.state,
      postalCode: r.postal_code,
      country: r.country,
      lat: num(r.lat),
      lng: num(r.lng),
      phone: r.phone,
      hours: r.hours,
      services: r.services,
    }));
    return list;
  });

export const adminBulkUpdateStatus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) =>
    z
      .object({
        ids: z.array(z.string()).min(1).max(50),
        status: z.enum(SHIPMENT_STATUSES),
        eventNote: z.string().trim().max(400).optional(),
        currentLocation: z.string().trim().max(120).optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    let updated = 0;
    for (const id of data.ids) {
      const current = await loadFull(id);
      if (!current) continue;
      const location = data.currentLocation ?? current.currentLocation ?? "Network";
      await sql`
        update shipments set
          status = ${data.status},
          current_location = ${location},
          last_updated = now()
        where id = ${id}
      `;
      const note =
        data.eventNote || `Bulk status update to ${data.status.replaceAll("_", " ")}.`;
      await sql`
        insert into tracking_events (id, shipment_id, status, location, description, occurred_at)
        values (${newId("ev")}, ${id}, ${data.status}, ${location}, ${note}, now())
      `;
      if (isShipmentStatus(data.status)) {
        await dispatchNotification({
          userId: current.userId,
          shipmentId: current.id,
          trackingNumber: current.trackingNumber,
          status: data.status,
        });
      }
      updated += 1;
    }
    await logActivity({
      actorUserId: context.userId,
      action: "shipment.bulk_update",
      entityType: "shipment",
      summary: `Bulk updated ${updated} shipment(s) → ${data.status.replaceAll("_", " ")}`,
      meta: { ids: data.ids, status: data.status },
    });
    return { updated };
  });

export const adminSeedDemoShipments = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    const samples = [
      {
        sender: { fullName: "Demo Sender LA", phone: "310-555-0100", email: "demo@swiftship.example", street: "100 Demo Ave", city: "Los Angeles", state: "CA", postalCode: "90017", country: "United States" },
        recipient: { fullName: "Demo Recipient NY", phone: "212-555-0199", email: "", street: "200 Sample St", city: "New York", state: "NY", postalCode: "10001", country: "United States" },
        service: "express" as const,
        status: "in_transit" as ShipmentStatus,
        events: [
          { status: "label_created" as ShipmentStatus, location: "Los Angeles, CA", description: "Demo label created.", hoursAgo: 48 },
          { status: "picked_up" as ShipmentStatus, location: "Los Angeles, CA", description: "Picked up from sender.", hoursAgo: 40 },
          { status: "departed" as ShipmentStatus, location: "Los Angeles Gateway Hub", description: "Departed origin hub.", hoursAgo: 30 },
          { status: "in_transit" as ShipmentStatus, location: "Dallas Inland Hub", description: "In transit via Dallas.", hoursAgo: 8 },
        ],
      },
      {
        sender: { fullName: "Harbor House Kitchen", phone: "312-555-0142", email: "", street: "88 Lake Shore Dr", city: "Chicago", state: "IL", postalCode: "60601", country: "United States" },
        recipient: { fullName: "Kite Paper Co.", phone: "415-555-0177", email: "", street: "12 Market St", city: "San Francisco", state: "CA", postalCode: "94105", country: "United States" },
        service: "standard" as const,
        status: "out_for_delivery" as ShipmentStatus,
        events: [
          { status: "label_created" as ShipmentStatus, location: "Chicago, IL", description: "Demo label created.", hoursAgo: 96 },
          { status: "picked_up" as ShipmentStatus, location: "Chicago, IL", description: "Collected at dock.", hoursAgo: 90 },
          { status: "in_transit" as ShipmentStatus, location: "Denver High Plains Center", description: "Linehaul westbound.", hoursAgo: 36 },
          { status: "arrived_facility" as ShipmentStatus, location: "San Francisco, CA", description: "Arrived destination facility.", hoursAgo: 10 },
          { status: "out_for_delivery" as ShipmentStatus, location: "San Francisco, CA", description: "On vehicle for delivery.", hoursAgo: 2 },
        ],
      },
      {
        sender: { fullName: "Northwind Studio", phone: "206-555-0111", email: "", street: "400 Pine St", city: "Seattle", state: "WA", postalCode: "98101", country: "United States" },
        recipient: { fullName: "Miami Retail Desk", phone: "305-555-0188", email: "", street: "1 Biscayne Blvd", city: "Miami", state: "FL", postalCode: "33132", country: "United States" },
        service: "overnight" as const,
        status: "delayed" as ShipmentStatus,
        events: [
          { status: "label_created" as ShipmentStatus, location: "Seattle, WA", description: "Demo overnight label.", hoursAgo: 28 },
          { status: "picked_up" as ShipmentStatus, location: "Seattle Cascade Hub", description: "Picked up for overnight.", hoursAgo: 24 },
          { status: "delayed" as ShipmentStatus, location: "Memphis Super Hub", description: "Weather delay — revised ETA posted.", hoursAgo: 6 },
        ],
      },
    ];
    const created: string[] = [];
    for (const sample of samples) {
      const quote = computeQuoteForService({
        origin: `${sample.sender.city}, ${sample.sender.state}`,
        destination: `${sample.recipient.city}, ${sample.recipient.state}`,
        weightLb: 6,
        lengthIn: 12,
        widthIn: 10,
        heightIn: 8,
        service: sample.service,
      });
      const id = newId("shp");
      const tracking = generateTrackingNumber();
      const location = sample.events[sample.events.length - 1]?.location ?? sample.sender.city;
      await sql`
        insert into shipments (
          id, tracking_number, status, service_code,
          sender_name, sender_phone, sender_email, sender_street, sender_city, sender_state, sender_postal, sender_country,
          recipient_name, recipient_phone, recipient_email, recipient_street, recipient_city, recipient_state, recipient_postal, recipient_country,
          package_type, weight_lb, length_in, width_in, height_in, description, declared_value,
          current_location, estimated_delivery, subtotal, tax, fees, total, payment_status, is_demo
        ) values (
          ${id}, ${tracking}, ${sample.status}, ${sample.service},
          ${sample.sender.fullName}, ${sample.sender.phone}, ${sample.sender.email || null},
          ${sample.sender.street}, ${sample.sender.city}, ${sample.sender.state}, ${sample.sender.postalCode}, ${sample.sender.country},
          ${sample.recipient.fullName}, ${sample.recipient.phone}, ${sample.recipient.email || null},
          ${sample.recipient.street}, ${sample.recipient.city}, ${sample.recipient.state}, ${sample.recipient.postalCode}, ${sample.recipient.country},
          ${"box"}, ${6}, ${12}, ${10}, ${8},
          ${"DEMO shipment — for product demos only."}, ${100},
          ${location}, ${quote.estimatedDelivery}, ${quote.subtotal}, ${quote.tax}, ${quote.fees}, ${quote.total},
          ${"completed"}, ${true}
        )
      `;
      if (sample.status === "delayed") {
        try {
          await sql`update shipments set exception_reason = ${"Weather delay at hub"} where id = ${id}`;
        } catch {
          // column arrives with migration 0005
        }
      }
      for (const ev of sample.events) {
        const occurred = new Date(Date.now() - ev.hoursAgo * 3600_000).toISOString();
        await sql`
          insert into tracking_events (id, shipment_id, status, location, description, occurred_at)
          values (${newId("ev")}, ${id}, ${ev.status}, ${ev.location}, ${ev.description}, ${occurred})
        `;
      }
      created.push(tracking);
    }
    await logActivity({
      actorUserId: context.userId,
      action: "demo.seed",
      entityType: "shipment",
      summary: `Seeded ${created.length} DEMO in-transit shipments`,
      meta: { tracking: created },
    });
    return { created };
  });

export const adminListActivity = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    try {
      const rows = await sql<{
        id: string;
        actor_user_id: string;
        action: string;
        entity_type: string;
        entity_id: string | null;
        summary: string;
        meta_json: string | null;
        created_at: string;
      }>`
        select * from admin_activity_log order by created_at desc limit 100
      `;
      const list: AdminActivity[] = rows.map((r) => ({
        id: r.id,
        actorUserId: r.actor_user_id,
        action: r.action,
        entityType: r.entity_type,
        entityId: r.entity_id,
        summary: r.summary,
        metaJson: r.meta_json,
        createdAt: String(r.created_at),
      }));
      return list;
    } catch {
      return [] as AdminActivity[];
    }
  });

export const adminGetCustomer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => z.object({ userId: z.string() }).parse(data))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    const profiles = await sql<{
      user_id: string;
      role: string;
      full_name: string | null;
      phone: string | null;
      company: string | null;
      created_at: string;
    }>`select * from profiles where user_id = ${data.userId} limit 1`;
    const p = profiles[0];
    if (!p) throw new Error("Customer not found.");
    const shipRows = await sql<ShipmentRow>`
      select * from shipments where user_id = ${data.userId} order by created_at desc limit 50
    `;
    const addrRows = await sql<{
      id: string;
      label: string;
      full_name: string;
      phone: string | null;
      email: string | null;
      street: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
      is_default: boolean;
    }>`select * from saved_addresses where user_id = ${data.userId} order by is_default desc`;
    const pay = await sql<{ total: unknown }>`
      select coalesce(sum(total), 0) as total from payments where user_id = ${data.userId} and status = ${"completed"}
    `;
    const addresses: SavedAddress[] = addrRows.map((r) => ({
      id: r.id,
      label: r.label,
      fullName: r.full_name,
      phone: r.phone ?? "",
      email: r.email ?? "",
      street: r.street,
      city: r.city,
      state: r.state,
      postalCode: r.postal_code,
      country: r.country,
      isDefault: Boolean(r.is_default),
    }));
    const detail: AdminCustomerDetail = {
      profile: {
        userId: p.user_id,
        role: p.role,
        fullName: p.full_name,
        phone: p.phone,
        company: p.company,
        createdAt: String(p.created_at),
      },
      shipments: shipRows.map((r) => mapShipment(r)),
      addresses,
      paymentsTotal: num(pay[0]?.total),
    };
    return detail;
  });

export const adminUpdateMessage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) =>
    z
      .object({
        id: z.string(),
        status: z.enum(["open", "in_progress", "resolved"]).optional(),
        staffNotes: z.string().max(2000).optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    const resolved = data.status === "resolved" ? new Date().toISOString() : null;
    await sql`
      update contact_messages set
        status = coalesce(${data.status ?? null}, status),
        staff_notes = coalesce(${data.staffNotes ?? null}, staff_notes),
        resolved_at = case when ${data.status ?? ""} = 'resolved' then ${resolved} else resolved_at end
      where id = ${data.id}
    `;
    await logActivity({
      actorUserId: context.userId,
      action: "inbox.update",
      entityType: "contact_message",
      entityId: data.id,
      summary: `Inbox message ${data.status ?? "updated"}`,
    });
    return { ok: true };
  });

