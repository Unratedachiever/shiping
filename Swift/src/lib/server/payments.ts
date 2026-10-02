import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { optionalAuthMiddleware } from "./optional-auth";
import { mapShipment, type EventRow, type ShipmentRow } from "./map";
import { newId } from "@/lib/utils";

/**
 * Payment processor seam. Never persist PAN / CVV — only brand + last4
 * returned by the provider.
 */
type ChargeInput = {
  amount: number;
  currency: "usd";
  method: "card" | "invoice" | "account";
  last4?: string;
  brand?: string;
  shipmentId: string;
};

type ChargeResult = {
  provider: "processor" | "stripe";
  providerRef: string;
  status: "completed" | "failed";
  last4: string | null;
  brand: string | null;
};

async function createCharge(input: ChargeInput): Promise<ChargeResult> {
  // Full PAN never reaches this layer — only tokenized brand + last four.
  return {
    provider: "processor",
    providerRef: `ch_${newId("pmt")}`,
    status: "completed",
    last4: input.method === "card" ? (input.last4 ?? null) : null,
    brand: input.method === "card" ? (input.brand ?? null) : null,
  };
}

export const checkoutShipment = createServerFn({ method: "POST" })
  .middleware([optionalAuthMiddleware])
  .validator((data: unknown) =>
    z
      .object({
        shipmentId: z.string(),
        method: z.enum(["card", "invoice", "account"]),
        last4: z.string().regex(/^\d{4}$/).optional(),
        brand: z.enum(["visa", "mastercard", "amex", "discover"]).optional(),
        billingName: z.string().trim().min(2).max(120),
      })
      .refine((d) => d.method !== "card" || Boolean(d.last4 && d.brand), {
        message: "Card details are required.",
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<ShipmentRow>`select * from shipments where id = ${data.shipmentId} limit 1`;
    const row = rows[0];
    if (!row) throw new Error("Shipment not found.");
    if (row.user_id && context.userId && row.user_id !== context.userId) {
      throw new Error("Shipment not found.");
    }
    if (row.payment_status === "completed") {
      const events = await sql<EventRow>`
        select id, status, location, description, occurred_at from tracking_events
        where shipment_id = ${row.id} order by occurred_at asc
      `;
      return { shipment: mapShipment(row, events), alreadyPaid: true };
    }
    const charge = await createCharge({
      amount: Number(row.total),
      currency: "usd",
      method: data.method,
      last4: data.last4,
      brand: data.brand,
      shipmentId: row.id,
    });
    if (charge.status !== "completed") {
      throw new Error("Payment was declined. Try another method.");
    }
    await sql`
      insert into payments (id, shipment_id, user_id, amount, tax, fees, total, method, status, provider, provider_ref, last4)
      values (
        ${newId("pmt")}, ${row.id}, ${context.userId}, ${row.subtotal}, ${row.tax}, ${row.fees}, ${row.total},
        ${data.method}, ${"completed"}, ${charge.provider}, ${charge.providerRef}, ${charge.last4}
      )
    `;
    await sql`
      update shipments set payment_status = ${"completed"}, payment_method = ${data.method}, last_updated = now()
      where id = ${row.id}
    `;
    if (context.userId && charge.last4 && charge.brand) {
      const existing = await sql<{ n: number }>`
        select count(*)::int as n from billing_methods where user_id = ${context.userId} and last4 = ${charge.last4}
      `;
      if ((existing[0]?.n ?? 0) === 0) {
        await sql`
          insert into billing_methods (id, user_id, brand, last4, is_default)
          values (${newId("pay")}, ${context.userId}, ${charge.brand}, ${charge.last4}, false)
        `;
      }
    }
    const events = await sql<EventRow>`
      select id, status, location, description, occurred_at from tracking_events
      where shipment_id = ${row.id} order by occurred_at asc
    `;
    const updated = await sql<ShipmentRow>`select * from shipments where id = ${row.id} limit 1`;
    return { shipment: mapShipment(updated[0]!, events), alreadyPaid: false };
  });

export const getCheckoutShipment = createServerFn({ method: "POST" })
  .middleware([optionalAuthMiddleware])
  .validator((data: unknown) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<ShipmentRow>`select * from shipments where id = ${data.id} limit 1`;
    const row = rows[0];
    if (!row) throw new Error("Shipment not found.");
    if (row.user_id && context.userId && row.user_id !== context.userId) {
      throw new Error("Shipment not found.");
    }
    const events = await sql<EventRow>`
      select id, status, location, description, occurred_at from tracking_events
      where shipment_id = ${row.id} order by occurred_at asc
    `;
    return mapShipment(row, events);
  });
