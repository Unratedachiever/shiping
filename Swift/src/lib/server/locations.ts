import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { num } from "@/lib/utils";
import type { Facility } from "@/lib/types";

type LocRow = {
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
};

function mapLoc(r: LocRow): Facility {
  return {
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
  };
}

export const searchLocations = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({
        q: z.string().trim().max(80).optional(),
        type: z.string().trim().max(40).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const sql = await getSql();
    const q = (data.q ?? "").toLowerCase();
    const type = data.type ?? "";
    const rows = await sql<LocRow>`
      select * from facility_locations
      order by country, state, city, name
    `;
    return rows
      .map(mapLoc)
      .filter((loc) => {
        if (type && loc.type !== type) return false;
        if (!q) return true;
        const blob = `${loc.name} ${loc.city} ${loc.state} ${loc.postalCode} ${loc.country}`.toLowerCase();
        return blob.includes(q);
      });
  });
