import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Page, PageHeader, Container } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/select";
import { getQuotes } from "@/lib/server/quotes";
import { CITIES } from "@/lib/cities";
import { formatDate, money } from "@/lib/utils";
import type { ServiceQuote } from "@/lib/pricing";

export const Route = createFileRoute("/quote")({ component: QuotePage });

function QuotePage() {
  const navigate = useNavigate();
  const [origin, setOrigin] = useState("Los Angeles, CA");
  const [destination, setDestination] = useState("New York, NY");
  const [weight, setWeight] = useState("8");
  const [length, setLength] = useState("14");
  const [width, setWidth] = useState("10");
  const [height, setHeight] = useState("8");
  const [quotes, setQuotes] = useState<ServiceQuote[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await getQuotes({
        data: {
          origin,
          destination,
          weightLb: Number(weight),
          lengthIn: Number(length),
          widthIn: Number(width),
          heightIn: Number(height),
        },
      });
      setQuotes(result);
      setSelected(result[0]?.code ?? null);
    } catch (err) {
      setQuotes(null);
      setError(err instanceof Error ? err.message : "Unable to quote this route.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Page>
      <PageHeader
        kicker="Rates"
        title="Get a shipping quote"
        description="Compare Ground, Express, Overnight, and Worldwide on the same origin and destination. Prices include tax and fuel handling."
      />
      <Container className="grid gap-8 py-10 lg:grid-cols-[20rem_1fr]">
        <Card className="h-fit rounded-xl shadow-card">
          <CardHeader>
            <CardTitle>Shipment details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="origin">Origin</Label>
                <NativeSelect id="origin" value={origin} onChange={(e) => setOrigin(e.target.value)}>
                  {CITIES.map((c) => (
                    <option key={`o-${c.name}-${c.state}`} value={`${c.name}, ${c.state}`}>
                      {c.country === "United States" ? `${c.name}, ${c.state}` : `${c.name}, ${c.country}`}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dest">Destination</Label>
                <NativeSelect id="dest" value={destination} onChange={(e) => setDestination(e.target.value)}>
                  {CITIES.map((c) => (
                    <option key={`d-${c.name}-${c.state}`} value={`${c.name}, ${c.state}`}>
                      {c.country === "United States" ? `${c.name}, ${c.state}` : `${c.name}, ${c.country}`}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="w">Weight (lb)</Label>
                <Input id="w" type="number" min={0.1} step={0.1} value={weight} onChange={(e) => setWeight(e.target.value)} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor="l">L (in)</Label>
                  <Input id="l" type="number" value={length} onChange={(e) => setLength(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="wd">W (in)</Label>
                  <Input id="wd" type="number" value={width} onChange={(e) => setWidth(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="h">H (in)</Label>
                  <Input id="h" type="number" value={height} onChange={(e) => setHeight(e.target.value)} />
                </div>
              </div>
              <FieldError>{error}</FieldError>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Calculating…" : "Calculate rates"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <div>
          {!quotes ? (
            <div className="empty-state">
              Enter a route and package size to compare Ground, Express, Overnight, and Worldwide.
            </div>
          ) : quotes.length === 0 ? (
            <div className="empty-state">No services available for this combination.</div>
          ) : (
            <div className="space-y-3">
              {quotes.map((q) => {
                const active = selected === q.code;
                return (
                  <Card
                    key={q.code}
                    className={`rounded-xl shadow-card transition-colors ${active ? "border-teal ring-1 ring-teal/40" : ""}`}
                  >
                    <CardContent className="p-5">
                      <button
                        type="button"
                        className="flex w-full flex-col gap-4 text-left sm:flex-row sm:items-start sm:justify-between"
                        onClick={() => setSelected(q.code)}
                      >
                        <div>
                          <p className="font-display text-lg font-semibold">{q.name}</p>
                          <p className="text-sm text-mist">{q.tagline}</p>
                          <p className="mt-2 text-sm">
                            <span className="font-medium text-teal">
                              ETA {formatDate(q.estimatedDelivery)}
                            </span>
                            <span className="text-mist">
                              {" "}
                              · {q.daysMin}–{q.daysMax} business days · {q.miles} miles
                            </span>
                          </p>
                          {active ? (
                            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                              <div>
                                <dt className="text-mist">Subtotal</dt>
                                <dd className="font-medium tabular-nums">{money(q.subtotal)}</dd>
                              </div>
                              <div>
                                <dt className="text-mist">Tax</dt>
                                <dd className="font-medium tabular-nums">{money(q.tax)}</dd>
                              </div>
                              <div>
                                <dt className="text-mist">Fees</dt>
                                <dd className="font-medium tabular-nums">{money(q.fees)}</dd>
                              </div>
                              <div>
                                <dt className="text-mist">Total</dt>
                                <dd className="font-medium tabular-nums">{money(q.total)}</dd>
                              </div>
                            </dl>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 items-center gap-4">
                          <p className="font-display text-2xl font-semibold tabular-nums">{money(q.total)}</p>
                        </div>
                      </button>
                      <div className="mt-4 flex justify-end">
                        <Button
                          onClick={() =>
                            void navigate({
                              to: "/ship",
                              search: { origin, destination, service: q.code, weight },
                            })
                          }
                        >
                          Ship with {q.name.replace("SwiftShip ", "")}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </Container>
    </Page>
  );
}
