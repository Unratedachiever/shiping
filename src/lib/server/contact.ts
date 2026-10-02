import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { newId, rateLimit } from "@/lib/utils";

export const submitContact = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({
        name: z.string().trim().min(2).max(120),
        email: z.string().trim().email(),
        topic: z.string().trim().min(2).max(80),
        message: z.string().trim().min(10).max(2000),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    if (!rateLimit(`contact:${data.email.toLowerCase()}`, 5, 10 * 60_000)) {
      throw new Error("Too many messages from this address. Please try later.");
    }
    const sql = await getSql();
    await sql`
      insert into contact_messages (id, name, email, topic, message)
      values (${newId("msg")}, ${data.name}, ${data.email}, ${data.topic}, ${data.message})
    `;
    return { ok: true };
  });
