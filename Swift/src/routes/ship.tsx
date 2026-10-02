import { useMemo, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Page, PageHeader, Container } from "@/components/layout/page";
import { AddressFields, emptyAddress } from "@/components/address-fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/select";
import { Textarea } from "@/components/ui/input";
import { createShipment } from "@/lib/server/shipments";
import { computeQuotes } from "@/lib/pricing";
import { PACKAGE_TYPES, SERVICES, type ServiceCode } from "@/lib/cities";
import { money } from "@/lib/utils";

type ShipSearch = {
  origin?: string;
  destination?: string;
  service?: string;
  weight?: string;
};

export const Route = createFileRoute("/ship")({
  component: ShipPage,
  validateSearch: (s: Record<string, unknown>): ShipSearch => ({
    origin: typeof s.origin === "string" ? s.origin : undefined,
    destination: typeof s.destination === "string" ? s.destination : undefined,
    service: typeof s.service === "string" ? s.service : undefined,
    weight: typeof s.weight === "string" ? s.weight : undefined,
  }),
});

function parseCity(value?: string) {
  if (!value) return { city: "", state: "" };
  const [city, state] = value.split(",").map((p) => p.trim());
  return { city: city ?? "", state: state ?? "" };
}

function ShipPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const originBits = parseCity(search.origin);
  const destBits = parseCity(search.destination);
  const [sender, setSender] = useState(() => ({
    ...emptyAddress(),
    city: originBits.city,
    state: originBits.state,
  }));
  const [recipient, setRecipient] = useState(() => ({
    ...emptyAddress(),
    city: destBits.city,
    state: destBits.state,
  }));
  const [packageType, setPackageType] = useState("box");
  const [weight, setWeight] = useState(search.weight ?? "5");
  const [length, setLength] = useState("14");
  const [width, setWidth] = useState("10");
  const [height, setHeight] = useState("8");
  const [description, setDescription] = useState("");
  const [declared, setDeclared] = useState("100");
  const [service, setService] = useState<ServiceCode>(
    (["standard", "express", "overnight", "international"] as const).includes(search.service as ServiceCode)
      ? (search.service as ServiceCode)
      : "express",
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const preview = useMemo(() => {
    try {
      if (!sender.city || !recipient.city) return null;
      return computeQuotes({
        origin: `${sender.city}, ${sender.state}`,
        destination: `${recipient.city}, ${recipient.state}`,
        weightLb: Number(weight) || 1,
        lengthIn: Number(length) || 10,
        widthIn: Number(width) || 8,
        heightIn: Number(height) || 4,
      }).find((q) => q.code === service);
    } catch {
      return null;
    }
  }, [sender.city, sender.state, recipient.city, recipient.state, weight, length, width, height, service]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const result = await createShipment({
        data: {
          sender,
          recipient,
          pkg: {
            packageType,
            weightLb: Number(weight),
            lengthIn: Number(length),
            widthIn: Number(width),
            heightIn: Number(height),
            description,
            declaredValue: Number(declared) || 0,
          },
          service,
        },
      });
      toast.success("Shipment created. Continue to payment.");
      await navigate({ to: "/checkout", search: { id: result.shipment.id } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not create shipment.";
      setError(msg);
      toast.error(msg);
      setBusy(false);
    }
  }

  return (
    <Page>
      <PageHeader
        kicker="Ship now"
        title="Create a shipment"
        description="Enter sender, recipient, and package details. We’ll generate a tracking number after you confirm payment."
      />
      <Container className="py-10">
        <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle>Sender</CardTitle>
              </CardHeader>
              <CardContent>
                <AddressFields id="sender" value={sender} onChange={setSender} />
              </CardContent>
            </Card>
            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle>Recipient</CardTitle>
              </CardHeader>
              <CardContent>
                <AddressFields id="recipient" value={recipient} onChange={setRecipient} />
              </CardContent>
            </Card>
            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle>Package</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="ptype">Package type</Label>
                  <NativeSelect id="ptype" value={packageType} onChange={(e) => setPackageType(e.target.value)}>
                    {PACKAGE_TYPES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="weight">Weight (lb)</Label>
                  <Input id="weight" type="number" min={0.1} step={0.1} value={weight} onChange={(e) => setWeight(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="length">Length (in)</Label>
                  <Input id="length" type="number" min={1} value={length} onChange={(e) => setLength(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="width">Width (in)</Label>
                  <Input id="width" type="number" min={1} value={width} onChange={(e) => setWidth(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="height">Height (in)</Label>
                  <Input id="height" type="number" min={1} value={height} onChange={(e) => setHeight(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="value">Declared value (USD)</Label>
                  <Input id="value" type="number" min={0} value={declared} onChange={(e) => setDeclared(e.target.value)} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="desc">Contents description</Label>
                  <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4">
            <Card className="rounded-xl lg:sticky lg:top-24">
              <CardHeader>
                <CardTitle>Service & rate</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(Object.keys(SERVICES) as ServiceCode[]).map((code) => {
                  const s = SERVICES[code];
                  return (
                    <label
                      key={code}
                      className={`flex cursor-pointer gap-3 rounded-lg border p-3 ${service === code ? "border-teal bg-accent/40" : "border-line"}`}
                    >
                      <input
                        type="radio"
                        name="service"
                        className="mt-1"
                        checked={service === code}
                        onChange={() => setService(code)}
                      />
                      <span>
                        <span className="block text-sm font-medium">{s.name}</span>
                        <span className="text-xs text-mist">{s.tagline}</span>
                      </span>
                    </label>
                  );
                })}
                <div className="border-t border-line pt-3 text-sm">
                  {preview ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-mist">Subtotal</span>
                        <span className="tabular-nums">{money(preview.subtotal)}</span>
                      </div>
                      <div className="mt-1 flex justify-between">
                        <span className="text-mist">Tax</span>
                        <span className="tabular-nums">{money(preview.tax)}</span>
                      </div>
                      <div className="mt-1 flex justify-between">
                        <span className="text-mist">Fees</span>
                        <span className="tabular-nums">{money(preview.fees)}</span>
                      </div>
                      <div className="mt-2 flex justify-between font-medium">
                        <span>Estimated total</span>
                        <span className="tabular-nums">{money(preview.total)}</span>
                      </div>
                      <p className="mt-2 text-xs text-mist">Est. delivery {preview.estimatedDelivery}</p>
                    </>
                  ) : (
                    <p className="text-mist">Enter origin and destination cities we serve to preview a rate.</p>
                  )}
                </div>
                <FieldError>{error}</FieldError>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Creating…" : "Continue to payment"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </form>
      </Container>
    </Page>
  );
}
