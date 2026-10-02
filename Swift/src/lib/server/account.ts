import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { newId, num } from "@/lib/utils";
import type { AppNotification, BillingMethod, DeliveryPreferences, Profile, SavedAddress } from "@/lib/types";

async function ensureProfileRow(userId: string, email: string | null, name: string | null) {
  const sql = await getSql();
  const existing = await sql<{ user_id: string }>`select user_id from profiles where user_id = ${userId} limit 1`;
  if (existing.length === 0) {
    await sql`
      insert into profiles (user_id, role, full_name)
      values (${userId}, ${"customer"}, ${name})
    `;
  }
  void email;
}

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const { getSessionUser } = await import("@/lib/auth/verify.server");
    const session = await getSessionUser();
    await ensureProfileRow(context.userId, session?.email ?? null, null);
    const rows = await sql<{
      user_id: string;
      role: "customer" | "admin";
      full_name: string | null;
      phone: string | null;
      company: string | null;
    }>`select user_id, role, full_name, phone, company from profiles where user_id = ${context.userId} limit 1`;
    const row = rows[0];
    const profile: Profile = {
      userId: context.userId,
      role: row?.role ?? "customer",
      fullName: row?.full_name ?? null,
      phone: row?.phone ?? null,
      company: row?.company ?? null,
      email: session?.email ?? null,
    };
    const adminCount = await sql<{ n: number }>`select count(*)::int as n from profiles where role = ${"admin"}`;
    return { profile, adminExists: num(adminCount[0]?.n) > 0 };
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) =>
    z
      .object({
        fullName: z.string().trim().max(120),
        phone: z.string().trim().max(40),
        company: z.string().trim().max(120),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      insert into profiles (user_id, role, full_name, phone, company, updated_at)
      values (${context.userId}, ${"customer"}, ${data.fullName || null}, ${data.phone || null}, ${data.company || null}, now())
      on conflict (user_id) do update set
        full_name = excluded.full_name,
        phone = excluded.phone,
        company = excluded.company,
        updated_at = now()
    `;
    return { ok: true };
  });

export const claimAdmin = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const existing = await sql<{ n: number }>`select count(*)::int as n from profiles where role = ${"admin"}`;
    if (num(existing[0]?.n) > 0) {
      throw new Error("Staff access is already assigned.");
    }
    await sql`
      insert into profiles (user_id, role, updated_at)
      values (${context.userId}, ${"admin"}, now())
      on conflict (user_id) do update set role = ${"admin"}, updated_at = now()
    `;
    return { ok: true };
  });

const addressSchema = z.object({
  id: z.string().optional(),
  label: z.string().trim().min(1).max(40),
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(40),
  email: z.string().trim().email().or(z.literal("")),
  street: z.string().trim().min(3).max(200),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(1).max(80),
  postalCode: z.string().trim().min(3).max(20),
  country: z.string().trim().min(2).max(80),
  isDefault: z.boolean().optional(),
});

export const listMyAddresses = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<{
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
    }>`
      select * from saved_addresses where user_id = ${context.userId} order by is_default desc, created_at desc
    `;
    return rows.map(
      (r): SavedAddress => ({
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
      }),
    );
  });

export const saveAddress = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => addressSchema.parse(data))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const id = data.id || newId("adr");
    if (data.isDefault) {
      await sql`update saved_addresses set is_default = false where user_id = ${context.userId}`;
    }
    if (data.id) {
      await sql`
        update saved_addresses set
          label = ${data.label},
          full_name = ${data.fullName},
          phone = ${data.phone || null},
          email = ${data.email || null},
          street = ${data.street},
          city = ${data.city},
          state = ${data.state},
          postal_code = ${data.postalCode},
          country = ${data.country},
          is_default = ${Boolean(data.isDefault)}
        where id = ${data.id} and user_id = ${context.userId}
      `;
    } else {
      await sql`
        insert into saved_addresses (
          id, user_id, label, full_name, phone, email, street, city, state, postal_code, country, is_default
        ) values (
          ${id}, ${context.userId}, ${data.label}, ${data.fullName}, ${data.phone || null}, ${data.email || null},
          ${data.street}, ${data.city}, ${data.state}, ${data.postalCode}, ${data.country}, ${Boolean(data.isDefault)}
        )
      `;
    }
    return { id };
  });

export const deleteAddress = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`delete from saved_addresses where id = ${data.id} and user_id = ${context.userId}`;
    return { ok: true };
  });

export const listMyNotifications = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      type: string;
      title: string;
      body: string;
      read: boolean;
      shipment_id: string | null;
      created_at: string;
    }>`
      select id, type, title, body, read, shipment_id, created_at
      from notifications
      where user_id = ${context.userId}
      order by created_at desc
      limit 80
    `;
    return rows.map(
      (r): AppNotification => ({
        id: r.id,
        type: r.type,
        title: r.title,
        body: r.body,
        read: Boolean(r.read),
        shipmentId: r.shipment_id,
        createdAt: r.created_at,
      }),
    );
  });

export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`update notifications set read = true where id = ${data.id} and user_id = ${context.userId}`;
    return { ok: true };
  });

export const listBillingMethods = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      brand: string;
      last4: string;
      exp_month: number | null;
      exp_year: number | null;
      is_default: boolean;
    }>`
      select id, brand, last4, exp_month, exp_year, is_default
      from billing_methods where user_id = ${context.userId}
      order by is_default desc, created_at desc
    `;
    return rows.map(
      (r): BillingMethod => ({
        id: r.id,
        brand: r.brand,
        last4: r.last4,
        expMonth: r.exp_month,
        expYear: r.exp_year,
        isDefault: Boolean(r.is_default),
      }),
    );
  });

export const addBillingMethod = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) =>
    z
      .object({
        brand: z.enum(["visa", "mastercard", "amex", "discover"]),
        last4: z.string().regex(/^\d{4}$/),
        expMonth: z.number().int().min(1).max(12),
        expYear: z.number().int().min(2026).max(2040),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const count = await sql<{ n: number }>`select count(*)::int as n from billing_methods where user_id = ${context.userId}`;
    const isDefault = num(count[0]?.n) === 0;
    const id = newId("pay");
    await sql`
      insert into billing_methods (id, user_id, brand, last4, exp_month, exp_year, is_default)
      values (${id}, ${context.userId}, ${data.brand}, ${data.last4}, ${data.expMonth}, ${data.expYear}, ${isDefault})
    `;
    return { id };
  });

export const deleteBillingMethod = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`delete from billing_methods where id = ${data.id} and user_id = ${context.userId}`;
    return { ok: true };
  });

export const markAllNotificationsRead = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await sql`update notifications set read = true where user_id = ${context.userId} and read = false`;
    return { ok: true };
  });

export const setDefaultAddress = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`update saved_addresses set is_default = false where user_id = ${context.userId}`;
    await sql`
      update saved_addresses set is_default = true
      where id = ${data.id} and user_id = ${context.userId}
    `;
    return { ok: true };
  });

const prefsSchema = z.object({
  signatureRequired: z.boolean(),
  leaveAtDoor: z.boolean(),
  holdAtLocation: z.boolean(),
  preferredLocationId: z.string().trim().max(64).nullable(),
  deliveryInstructions: z.string().trim().max(500),
  notifyEmail: z.boolean(),
  notifySms: z.boolean(),
});

export const getDeliveryPreferences = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    try {
      const rows = await sql<{
        signature_required: boolean;
        leave_at_door: boolean;
        hold_at_location: boolean;
        preferred_location_id: string | null;
        delivery_instructions: string | null;
        notify_email: boolean;
        notify_sms: boolean;
      }>`select * from delivery_preferences where user_id = ${context.userId} limit 1`;
      const r = rows[0];
      const prefs: DeliveryPreferences = r
        ? {
            signatureRequired: Boolean(r.signature_required),
            leaveAtDoor: Boolean(r.leave_at_door),
            holdAtLocation: Boolean(r.hold_at_location),
            preferredLocationId: r.preferred_location_id,
            deliveryInstructions: r.delivery_instructions ?? "",
            notifyEmail: Boolean(r.notify_email),
            notifySms: Boolean(r.notify_sms),
          }
        : {
            signatureRequired: false,
            leaveAtDoor: true,
            holdAtLocation: false,
            preferredLocationId: null,
            deliveryInstructions: "",
            notifyEmail: true,
            notifySms: false,
          };
      return prefs;
    } catch {
      return {
        signatureRequired: false,
        leaveAtDoor: true,
        holdAtLocation: false,
        preferredLocationId: null,
        deliveryInstructions: "",
        notifyEmail: true,
        notifySms: false,
      } satisfies DeliveryPreferences;
    }
  });

export const saveDeliveryPreferences = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => prefsSchema.parse(data))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      insert into delivery_preferences (
        user_id, signature_required, leave_at_door, hold_at_location,
        preferred_location_id, delivery_instructions, notify_email, notify_sms, updated_at
      ) values (
        ${context.userId}, ${data.signatureRequired}, ${data.leaveAtDoor}, ${data.holdAtLocation},
        ${data.preferredLocationId}, ${data.deliveryInstructions || null},
        ${data.notifyEmail}, ${data.notifySms}, now()
      )
      on conflict (user_id) do update set
        signature_required = excluded.signature_required,
        leave_at_door = excluded.leave_at_door,
        hold_at_location = excluded.hold_at_location,
        preferred_location_id = excluded.preferred_location_id,
        delivery_instructions = excluded.delivery_instructions,
        notify_email = excluded.notify_email,
        notify_sms = excluded.notify_sms,
        updated_at = now()
    `;
    return { ok: true };
  });

