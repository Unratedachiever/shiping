import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { Page, PageHeader, Container } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { checkoutShipment, getCheckoutShipment } from "@/lib/server/payments";
import { SERVICES } from "@/lib/cities";
import { money } from "@/lib/utils";
import type { Shipment } from "@/lib/types";

type Search = { id?: string };
type CardBrand = "visa" | "mastercard" | "amex" | "discover";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
  validateSearch: (s: Record<string, unknown>): Search => ({
    id: typeof s.id === "string" ? s.id : undefined,
  }),
});

function detectBrand(digits: string): CardBrand {
  if (/^3[47]/.test(digits)) return "amex";
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return "mastercard";
  if (/^6(?:011|5)/.test(digits)) return "discover";
  return "visa";
}

function luhnOk(digits: string): boolean {
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = Number(digits[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

function formatCard(digits: string): string {
  const brand = detectBrand(digits);
  if (brand === "amex") {
    return [digits.slice(0, 4), digits.slice(4, 10), digits.slice(10, 15)].filter(Boolean).join(" ");
  }
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

function expiryValid(value: string): boolean {
  const m = value.match(/^(\d{2})\s*\/\s*(\d{2})$/);
  if (!m) return false;
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return false;
  const now = new Date();
  const exp = new Date(year, month, 0, 23, 59, 59);
  return exp >= now;
}

function CheckoutPage() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [method, setMethod] = useState<"card" | "invoice" | "account">("card");
  const [name, setName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");

  useEffect(() => {
    if (!id) return;
    getCheckoutShipment({ data: { id } })
      .then(setShipment)
      .catch((e) => setError(e instanceof Error ? e.message : "Shipment not found."));
  }, [id]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!shipment) return;
    const digits = cardNumber.replace(/\D/g, "");
    if (method === "card") {
      if (!luhnOk(digits)) {
        setError("Enter a valid card number.");
        return;
      }
      if (!expiryValid(expiry)) {
        setError("Enter a valid expiration date (MM/YY).");
        return;
      }
      const amex = detectBrand(digits) === "amex";
      if ((amex && cvc.length !== 4) || (!amex && cvc.length !== 3)) {
        setError("Enter the security code from your card.");
        return;
      }
    }
    setBusy(true);
    setError(null);
    try {
      const result = await checkoutShipment({
        data: {
          shipmentId: shipment.id,
          method,
          last4: method === "card" ? digits.slice(-4) : undefined,
          brand: method === "card" ? detectBrand(digits) : undefined,
          billingName: name || shipment.sender.fullName,
        },
      });
      toast.success("Payment received. Your tracking number is ready.");
      await navigate({
        to: "/track/$trackingNumber",
        params: { trackingNumber: result.shipment.trackingNumber },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Payment failed.";
      setError(msg);
      toast.error(msg);
      setBusy(false);
    }
  }

  if (!id) {
    return (
      <Page>
        <PageHeader title="Checkout" description="No shipment selected." />
        <Container className="py-10">
          <Button asChild>
            <Link to="/ship">Create a shipment</Link>
          </Button>
        </Container>
      </Page>
    );
  }

  const svc = shipment && shipment.serviceCode in SERVICES ? SERVICES[shipment.serviceCode as keyof typeof SERVICES] : null;
  const brand = detectBrand(cardNumber.replace(/\D/g, ""));
  const cvcLen = brand === "amex" ? 4 : 3;

  return (
    <Page>
      <PageHeader
        kicker="Payment"
        title="Pay shipping charges"
        description="Pay by card, invoice, or the method on your account. Full card numbers are never stored."
      />
      <Container className="grid gap-6 py-10 lg:grid-cols-2">
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Order summary</CardTitle>
          </CardHeader>
          <CardContent>
            {!shipment ? (
              <Skeleton className="h-48" />
            ) : (
              <dl className="space-y-2 text-sm">
                <Row label="Service" value={svc?.name ?? shipment.serviceCode} />
                <Row label="Package" value={`${shipment.package.packageType} · ${shipment.package.weightLb} lb`} />
                <Row label="From" value={`${shipment.sender.city}, ${shipment.sender.state}`} />
                <Row label="To" value={`${shipment.recipient.city}, ${shipment.recipient.state}`} />
                <Row label="Shipping" value={money(shipment.subtotal)} />
                <Row label="Tax" value={money(shipment.tax)} />
                <Row label="Fees" value={money(shipment.fees)} />
                <div className="flex justify-between border-t border-line pt-3 text-base font-medium">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{money(shipment.total)}</dd>
                </div>
                {shipment.paymentStatus === "completed" ? (
                  <p className="pt-2 text-sm text-success">Already paid. You can view tracking any time.</p>
                ) : null}
              </dl>
            )}
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Payment method</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {(["card", "invoice", "account"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    className={`rounded-md border px-3 py-2 text-sm capitalize ${method === m ? "border-teal bg-accent" : "border-line"}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bname">Billing name</Label>
                <Input
                  id="bname"
                  autoComplete="cc-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              {method === "card" ? (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="ccnum">Card number</Label>
                    <Input
                      id="ccnum"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      placeholder="•••• •••• •••• ••••"
                      value={cardNumber}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 19);
                        setCardNumber(formatCard(digits));
                      }}
                      required
                    />
                    <p className="text-xs capitalize text-mist">{brand}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="exp">Expiration</Label>
                      <Input
                        id="exp"
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        placeholder="MM/YY"
                        value={expiry}
                        onChange={(e) => {
                          const d = e.target.value.replace(/\D/g, "").slice(0, 4);
                          setExpiry(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d);
                        }}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="cvc">Security code</Label>
                      <Input
                        id="cvc"
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        placeholder={brand === "amex" ? "••••" : "•••"}
                        maxLength={cvcLen}
                        value={cvc}
                        onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, cvcLen))}
                        required
                      />
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-mist">
                  {method === "invoice"
                    ? "We’ll mark this shipment paid on account and issue an invoice reference."
                    : "Charge the default method on the signed-in account."}
                </p>
              )}
              <FieldError>{error}</FieldError>
              <Button type="submit" className="w-full" disabled={busy || !shipment}>
                {busy ? "Processing…" : `Pay ${shipment ? money(shipment.total) : ""}`}
              </Button>
              <p className="flex items-center justify-center gap-1.5 text-xs text-mist">
                <Lock className="size-3" />
                Encrypted checkout · last four digits only on file
              </p>
            </form>
          </CardContent>
        </Card>
      </Container>
    </Page>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-mist">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}
