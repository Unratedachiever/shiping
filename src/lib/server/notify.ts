import { getSql } from "@/lib/db";
import { newId } from "@/lib/utils";
import { notificationForStatus, type ShipmentStatus } from "@/lib/status";

/**
 * In-app notification writer. Email/SMS providers plug in here later —
 * never store provider secrets in the client. Calls are fire-and-forget
 * from shipment mutations.
 */
export async function dispatchNotification(input: {
  userId: string | null;
  shipmentId: string;
  trackingNumber: string;
  status: ShipmentStatus;
  extra?: string;
}) {
  if (!input.userId) return;
  const payload = notificationForStatus(input.status, input.trackingNumber);
  if (!payload) return;
  const sql = await getSql();
  const body = input.extra ? `${payload.body} ${input.extra}` : payload.body;
  await sql`
    insert into notifications (id, user_id, shipment_id, type, title, body, channel)
    values (
      ${newId("ntf")},
      ${input.userId},
      ${input.shipmentId},
      ${payload.type},
      ${payload.title},
      ${body},
      ${"in_app"}
    )
  `;
  // Architecture seam for later providers:
  // await emailProvider.send({ to, subject: payload.title, text: body })
  // await smsProvider.send({ to, text: body })
}
