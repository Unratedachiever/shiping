import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AdminShell } from "@/components/layout/admin-guard";
import { AddressFields, emptyAddress } from "@/components/address-fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/select";
import { adminCreateShipment } from "@/lib/server/admin";
import { PACKAGE_TYPES, type ServiceCode } from "@/lib/cities";

export const Route = createFileRoute("/admin/create")({ component: AdminCreate });

function AdminCreate() {
  const navigate = useNavigate();
  const [sender, setSender] = useState(emptyAddress());
  const [recipient, setRecipient] = useState(emptyAddress());
  const [packageType, setPackageType] = useState("box");
  const [weight, setWeight] = useState("8");
  const [length, setLength] = useState("14");
  const [width, setWidth] = useState("10");
  const [height, setHeight] = useState("8");
  const [description, setDescription] = useState("");
  const [declared, setDeclared] = useState("100");
  const [service, setService] = useState<ServiceCode>("express");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const shipment = await adminCreateShipment({
        data: {
          sender,
          recipient,
          packageType,
          weightLb: Number(weight),
          lengthIn: Number(length),
          widthIn: Number(width),
          heightIn: Number(height),
          description,
          declaredValue: Number(declared) || 0,
          service,
        },
      });
      toast.success(`Created ${shipment.trackingNumber}`);
      await navigate({ to: "/admin/shipments/$id", params: { id: shipment.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Create failed.");
      setBusy(false);
    }
  }

  return (
    <AdminShell>
      <h1 className="font-display text-2xl font-semibold">Create shipment</h1>
      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Sender</CardTitle>
          </CardHeader>
          <CardContent>
            <AddressFields id="as" value={sender} onChange={setSender} />
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Recipient</CardTitle>
          </CardHeader>
          <CardContent>
            <AddressFields id="ar" value={recipient} onChange={setRecipient} />
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Package</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <NativeSelect value={packageType} onChange={(e) => setPackageType(e.target.value)}>
              {PACKAGE_TYPES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </NativeSelect>
            <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
            <Input type="number" value={length} onChange={(e) => setLength(e.target.value)} />
            <Input type="number" value={width} onChange={(e) => setWidth(e.target.value)} />
            <Input type="number" value={height} onChange={(e) => setHeight(e.target.value)} />
            <Input type="number" value={declared} onChange={(e) => setDeclared(e.target.value)} />
            <Input className="sm:col-span-2" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
            <div className="space-y-1.5">
              <Label>Service</Label>
              <NativeSelect value={service} onChange={(e) => setService(e.target.value as ServiceCode)}>
                <option value="standard">Ground</option>
                <option value="express">Express</option>
                <option value="overnight">Overnight</option>
                <option value="international">Worldwide</option>
              </NativeSelect>
            </div>
            <Button type="submit" disabled={busy} className="sm:col-span-2">
              {busy ? "Creating…" : "Generate tracking number"}
            </Button>
          </CardContent>
        </Card>
      </form>
    </AdminShell>
  );
}
