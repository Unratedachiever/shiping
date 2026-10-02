import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AdminShell } from "@/components/layout/admin-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { adminDeleteLocation, adminListLocations, adminUpsertLocation } from "@/lib/server/admin";
import type { Facility } from "@/lib/types";

export const Route = createFileRoute("/admin/locations")({ component: AdminLocations });

const EMPTY = {
  name: "",
  type: "service" as const,
  street: "",
  city: "",
  state: "",
  postalCode: "",
  country: "United States",
  lat: "34.05",
  lng: "-118.24",
  phone: "1-800-794-3844",
  hours: "Mon–Fri 8:00–19:00",
  services: "Drop-off, pickup",
};

function AdminLocations() {
  const [rows, setRows] = useState<Facility[] | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  function reload() {
    void adminListLocations().then(setRows);
  }
  useEffect(() => {
    reload();
  }, []);

  function set<K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await adminUpsertLocation({
        data: {
          name: form.name,
          type: form.type,
          street: form.street,
          city: form.city,
          state: form.state,
          postalCode: form.postalCode,
          country: form.country,
          lat: Number(form.lat),
          lng: Number(form.lng),
          phone: form.phone,
          hours: form.hours,
          services: form.services,
        },
      });
      toast.success("Location saved.");
      setForm(EMPTY);
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save location.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminShell>
      <h1 className="font-display text-2xl font-semibold">Network locations</h1>
      <p className="mt-1 text-sm text-mist">Hubs, service centers, and drop-off points shown on the public Locations page.</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="space-y-3">
          {!rows ? (
            <Skeleton className="h-48" />
          ) : rows.length === 0 ? (
            <p className="text-sm text-mist">No facilities yet.</p>
          ) : (
            rows.map((loc) => (
              <Card key={loc.id} className="rounded-xl">
                <CardContent className="flex items-start justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium">{loc.name}</p>
                    <p className="mt-1 text-sm capitalize text-mist">{loc.type}</p>
                    <p className="mt-1 text-sm text-mist">
                      {loc.street}, {loc.city}, {loc.state} {loc.postalCode}
                    </p>
                    <p className="text-sm text-mist">{loc.hours}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (!confirm("Remove this location from the public directory?")) return;
                      void adminDeleteLocation({ data: { id: loc.id } })
                        .then(() => {
                          toast.success("Removed.");
                          reload();
                        })
                        .catch((e) => toast.error(e instanceof Error ? e.message : "Failed."));
                    }}
                  >
                    Remove
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        <Card className="h-fit rounded-xl">
          <CardHeader>
            <CardTitle>Add a location</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <NativeSelect value={form.type} onChange={(e) => set("type", e.target.value as typeof form.type)}>
                  <option value="distribution">Distribution hub</option>
                  <option value="warehouse">Warehouse</option>
                  <option value="service">Service center</option>
                  <option value="pickup">Pickup / drop-off</option>
                </NativeSelect>
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Street</Label>
                <Input value={form.street} onChange={(e) => set("street", e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>City</Label>
                <Input value={form.city} onChange={(e) => set("city", e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>State</Label>
                <Input value={form.state} onChange={(e) => set("state", e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Postal</Label>
                <Input value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Country</Label>
                <Input value={form.country} onChange={(e) => set("country", e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Latitude</Label>
                <Input value={form.lat} onChange={(e) => set("lat", e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Longitude</Label>
                <Input value={form.lng} onChange={(e) => set("lng", e.target.value)} required />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Hours</Label>
                <Input value={form.hours} onChange={(e) => set("hours", e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Services</Label>
                <Input value={form.services} onChange={(e) => set("services", e.target.value)} />
              </div>
              <Button type="submit" disabled={busy} className="sm:col-span-2">
                {busy ? "Saving…" : "Add location"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
