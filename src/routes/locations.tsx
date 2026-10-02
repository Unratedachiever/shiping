import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Page, PageHeader, Container } from "@/components/layout/page";
import { FacilitiesMap } from "@/components/route-map";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { searchLocations } from "@/lib/server/locations";
import type { Facility } from "@/lib/types";

export const Route = createFileRoute("/locations")({ component: LocationsPage });

const TYPES = [
  { value: "", label: "All types" },
  { value: "distribution", label: "Distribution centers" },
  { value: "warehouse", label: "Warehouses" },
  { value: "pickup", label: "Pickup locations" },
  { value: "service", label: "Service centers" },
];

function LocationsPage() {
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [all, setAll] = useState<Facility[] | null>(null);

  useEffect(() => {
    void searchLocations({ data: {} }).then(setAll);
  }, []);

  const filtered = useMemo(() => {
    if (!all) return [];
    const needle = q.trim().toLowerCase();
    return all.filter((loc) => {
      if (type && loc.type !== type) return false;
      if (!needle) return true;
      return `${loc.name} ${loc.city} ${loc.state} ${loc.postalCode} ${loc.country}`.toLowerCase().includes(needle);
    });
  }, [all, q, type]);

  return (
    <Page>
      <PageHeader
        kicker="Network"
        title="Find a SwiftShip location"
        description="Search warehouses, distribution hubs, pickup points, and service centers by city, state, ZIP, or country."
      />
      <Container className="py-10">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="City, state, ZIP, or country"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search locations"
          />
          <NativeSelect value={type} onChange={(e) => setType(e.target.value)} className="sm:w-56">
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </NativeSelect>
        </div>
        {!all ? (
          <Skeleton className="mt-6 h-72" />
        ) : (
          <FacilitiesMap
            className="mt-6 h-64 sm:h-80"
            points={filtered.map((f) => ({ id: f.id, name: f.city, lat: f.lat, lng: f.lng, type: f.type }))}
          />
        )}
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {filtered.map((f) => (
            <Card key={f.id} className="rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-display text-lg font-semibold">{f.name}</h2>
                  <Badge tone="info" className="capitalize">
                    {f.type}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-mist">
                  {f.street}
                  <br />
                  {f.city}, {f.state} {f.postalCode}
                  <br />
                  {f.country}
                </p>
                <p className="mt-3 text-sm">{f.hours}</p>
                <p className="text-sm text-mist">{f.phone}</p>
                <p className="mt-2 text-sm text-mist">{f.services}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        {all && filtered.length === 0 ? (
          <p className="mt-8 text-center text-mist">No locations match that search.</p>
        ) : null}
      </Container>
    </Page>
  );
}
