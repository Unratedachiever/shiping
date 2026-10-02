import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { DashShell, ACCOUNT_LINKS } from "@/components/layout/dash-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/select";
import { addBillingMethod, deleteBillingMethod, listBillingMethods } from "@/lib/server/account";
import type { BillingMethod } from "@/lib/types";

export const Route = createFileRoute("/account/billing")({ component: BillingPage });

function BillingPage() {
  const [rows, setRows] = useState<BillingMethod[]>([]);
  const [brand, setBrand] = useState<"visa" | "mastercard" | "amex" | "discover">("visa");
  const [last4, setLast4] = useState("");
  const [month, setMonth] = useState("12");
  const [year, setYear] = useState("2028");

  function reload() {
    void listBillingMethods().then(setRows);
  }
  useEffect(() => {
    reload();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await addBillingMethod({
        data: { brand, last4, expMonth: Number(month), expYear: Number(year) },
      });
      toast.success("Payment method saved.");
      setLast4("");
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save.");
    }
  }

  return (
    <DashShell title="Account" links={ACCOUNT_LINKS}>
      <h1 className="font-display text-2xl font-semibold">Billing</h1>
      <p className="mt-1 text-sm text-mist">We store brand and last four digits only — never a full card number.</p>
      <div className="mt-4 space-y-2">
        {rows.length === 0 ? <p className="text-sm text-mist">No methods on file.</p> : null}
        {rows.map((r) => (
          <Card key={r.id} className="rounded-xl">
            <CardContent className="flex items-center justify-between p-4">
              <p className="text-sm capitalize">
                {r.brand} ···· {r.last4}
                {r.expMonth && r.expYear ? ` · ${r.expMonth}/${r.expYear}` : ""}
              </p>
              <Button variant="ghost" size="sm" onClick={() => void deleteBillingMethod({ data: { id: r.id } }).then(reload)}>
                Remove
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-6 rounded-xl">
        <CardHeader>
          <CardTitle>Add a method</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Brand</Label>
              <NativeSelect value={brand} onChange={(e) => setBrand(e.target.value as typeof brand)}>
                <option value="visa">Visa</option>
                <option value="mastercard">Mastercard</option>
                <option value="amex">Amex</option>
                <option value="discover">Discover</option>
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label>Last four</Label>
              <Input value={last4} maxLength={4} onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))} required />
            </div>
            <div className="space-y-1.5">
              <Label>Exp month</Label>
              <Input value={month} onChange={(e) => setMonth(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Exp year</Label>
              <Input value={year} onChange={(e) => setYear(e.target.value)} />
            </div>
            <Button type="submit" className="sm:col-span-2">
              Save
            </Button>
          </form>
        </CardContent>
      </Card>
    </DashShell>
  );
}
