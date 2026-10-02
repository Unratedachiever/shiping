import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { computeQuotes } from "@/lib/pricing";
import { rateLimit } from "@/lib/utils";

const quoteSchema = z.object({
  origin: z.string().trim().min(2).max(80),
  destination: z.string().trim().min(2).max(80),
  weightLb: z.number().positive().max(2000),
  lengthIn: z.number().positive().max(120).default(12),
  widthIn: z.number().positive().max(120).default(10),
  heightIn: z.number().positive().max(120).default(8),
});

export const getQuotes = createServerFn({ method: "POST" })
  .validator((data: unknown) => quoteSchema.parse(data))
  .handler(async ({ data }) => {
    if (!rateLimit("quotes", 40, 60_000)) {
      throw new Error("Too many quote requests. Please wait a moment.");
    }
    return computeQuotes(data);
  });
