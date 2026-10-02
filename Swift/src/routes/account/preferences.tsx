import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { DashShell, ACCOUNT_LINKS } from "@/components/layout/dash-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/select";
import { Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getDeliveryPreferences, saveDeliveryPreferences } from "@/lib/server/account";
import { searchLocations } from "@/lib/server/locations";
import type { DeliveryPreferences, Facility } from "@/lib/types";

export const Route = createFileRoute("/account/preferences")({ component: PreferencesPage });

function PreferencesPage() {
  const [prefs, setPrefs] = useState<DeliveryPreferences | null>(null);
  const [locations, setLocations] = useState<Facility[]>([]);

  useEffect(() => {
    void getDeliveryPreferences().then(setPrefs).catch(() => undefined);
    void searchLocations({ data: {} })
      .then((rows) => setLocations(rows.filter((l) => l.type === "pickup" || l.type === "service")))
      .catch(() => setLocations([]));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!prefs) return;
    try {
      await saveDeliveryPreferences({ data: prefs });
      toast.success("Delivery preferences saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save.");
    }
  }

  return (
    <DashShell title="Account" links={ACCOUNT_LINKS}>
      <h1 className="font-display text-2xl font-semibold">Delivery preferences</h1>
      <p className="mt-1 text-sm text-mist">
        Stub preferences applied to your account profile. Hold-at-location uses SwiftShip pickup points — not a live
        carrier hold network.
      </p>
      {!prefs ? (
        <Skeleton className="mt-6 h-48" />
      ) : (
        <Card className="mt-6 rounded-xl">
          <CardHeader>
            <CardTitle>Defaults</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 rounded border-line"
                  checked={prefs.signatureRequired}
                  onChange={(e) => setPrefs({ ...prefs, signatureRequired: e.target.checked })}
                />
                Signature required
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 rounded border-line"
                  checked={prefs.leaveAtDoor}
                  onChange={(e) => setPrefs({ ...prefs, leaveAtDoor: e.target.checked })}
                />
                Leave at door when safe
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 rounded border-line"
                  checked={prefs.holdAtLocation}
                  onChange={(e) => setPrefs({ ...prefs, holdAtLocation: e.target.checked })}
                />
                Prefer hold at location
              </label>
              {prefs.holdAtLocation ? (
                <div className="space-y-1.5">
                  <Label htmlFor="loc">Preferred location</Label>
                  <NativeSelect
                    id="loc"
                    value={prefs.preferredLocationId ?? ""}
                    onChange={(e) =>
                      setPrefs({ ...prefs, preferredLocationId: e.target.value || null })
                    }
                  >
                    <option value="">Select a pickup / service center</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} — {l.city}, {l.state}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
              ) : null}
              <div className="space-y-1.5">
                <Label htmlFor="instr">Delivery instructions</Label>
                <Textarea
                  id="instr"
                  value={prefs.deliveryInstructions}
                  onChange={(e) => setPrefs({ ...prefs, deliveryInstructions: e.target.value })}
                  placeholder="Gate code, building name, preferred side door…"
                />
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-line"
                    checked={prefs.notifyEmail}
                    onChange={(e) => setPrefs({ ...prefs, notifyEmail: e.target.checked })}
                  />
                  Email notices
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-line"
                    checked={prefs.notifySms}
                    onChange={(e) => setPrefs({ ...prefs, notifySms: e.target.checked })}
                  />
                  SMS notices (stub)
                </label>
              </div>
              <Button type="submit">Save preferences</Button>
            </form>
          </CardContent>
        </Card>
      )}
    </DashShell>
  );
}
