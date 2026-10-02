import { CITIES, SERVICES, type ServiceCode, findCity } from "./cities";
import { haversineMiles, toDateOnly, todayPlus } from "./utils";

export type QuoteInput = {
  origin: string;
  destination: string;
  weightLb: number;
  lengthIn: number;
  widthIn: number;
  heightIn: number;
  service?: ServiceCode;
};

export type ServiceQuote = {
  code: ServiceCode;
  name: string;
  tagline: string;
  daysMin: number;
  daysMax: number;
  miles: number;
  estimatedDelivery: string;
  subtotal: number;
  tax: number;
  fees: number;
  total: number;
};

const TAX_RATE = 0.075;
const FUEL_RATE = 0.042;
const HANDLING = 4.95;
const DIM_DIVISOR = 139;

export function resolveCityOrThrow(query: string, label: string) {
  const city = findCity(query);
  if (!city) {
    throw new Error(
      `We don’t serve “${query}” yet as a ${label}. Try a major city (e.g. Los Angeles, New York).`,
    );
  }
  return city;
}

export function computeQuotes(input: QuoteInput): ServiceQuote[] {
  const weight = Math.max(0.1, Number(input.weightLb) || 0);
  const l = Math.max(1, Number(input.lengthIn) || 10);
  const w = Math.max(1, Number(input.widthIn) || 8);
  const h = Math.max(1, Number(input.heightIn) || 4);
  const origin = resolveCityOrThrow(input.origin, "origin");
  const dest = resolveCityOrThrow(input.destination, "destination");
  const miles = Math.max(15, haversineMiles(origin, dest));
  const dimWeight = (l * w * h) / DIM_DIVISOR;
  const billable = Math.max(weight, dimWeight);
  const international =
    origin.country !== dest.country || origin.country !== "United States";
  const distanceFactor = 1 + (miles / 2800) * 0.85;

  const codes: ServiceCode[] = international
    ? ["international", "express"]
    : ["standard", "express", "overnight"];

  return codes.map((code) => {
    const svc = SERVICES[code];
    const subtotal =
      Math.round(
        (svc.base + billable * svc.perLb) * svc.multiplier * distanceFactor * 100,
      ) / 100;
    const fees = Math.round((HANDLING + subtotal * FUEL_RATE) * 100) / 100;
    const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
    const total = Math.round((subtotal + tax + fees) * 100) / 100;
    const transit = Math.min(
      svc.daysMax,
      Math.max(svc.daysMin, Math.round(miles / (code === "overnight" ? 2200 : code === "express" ? 900 : 420))),
    );
    return {
      code,
      name: svc.name,
      tagline: svc.tagline,
      daysMin: svc.daysMin,
      daysMax: svc.daysMax,
      miles: Math.round(miles),
      estimatedDelivery: toDateOnly(todayPlus(transit)),
      subtotal,
      tax,
      fees,
      total,
    };
  });
}

export function computeQuoteForService(input: QuoteInput & { service: ServiceCode }): ServiceQuote {
  const all = computeQuotes(input);
  const match = all.find((q) => q.code === input.service);
  if (match) return match;
  // Force a quote for a service that was filtered out (e.g. international on domestic)
  const origin = resolveCityOrThrow(input.origin, "origin");
  const dest = resolveCityOrThrow(input.destination, "destination");
  const forced = computeQuotes({
    ...input,
    origin: origin.country !== dest.country ? input.origin : "London",
    destination: origin.country !== dest.country ? input.destination : input.destination,
  }).find((q) => q.code === input.service);
  if (forced) return { ...forced };
  const fallback = all[0];
  if (!fallback) throw new Error("Unable to price this route.");
  return fallback;
}

export function cityOptions() {
  return CITIES.map((c) => ({
    value: `${c.name}, ${c.state}`,
    label: c.country === "United States" ? `${c.name}, ${c.state}` : `${c.name}, ${c.country}`,
  }));
}
