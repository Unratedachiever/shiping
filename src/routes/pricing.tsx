import { createFileRoute, Link } from "@tanstack/react-router";
import { Page, PageHeader, Container } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { SERVICES } from "@/lib/cities";
import { money } from "@/lib/utils";

export const Route = createFileRoute("/pricing")({ component: PricingPage });

function PricingPage() {
  return (
    <Page>
      <PageHeader
        kicker="Pricing"
        title="Transparent rates, not a maze"
        description="Every quote starts from a published base and per-pound rate, then applies distance, dimensional weight, tax, and a fuel surcharge."
      />
      <Container className="py-10">
        <div className="overflow-x-auto rounded-xl border border-line bg-card">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line bg-paper-2/60 text-xs uppercase tracking-wider text-mist">
              <tr>
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">Transit</th>
                <th className="px-4 py-3 font-medium">Base</th>
                <th className="px-4 py-3 font-medium">Per lb</th>
                <th className="px-4 py-3 font-medium">Best for</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(SERVICES).map((s) => (
                <tr key={s.code} className="border-b border-line last:border-0">
                  <td className="px-4 py-4 font-medium">{s.name}</td>
                  <td className="px-4 py-4 tabular-nums">
                    {s.daysMin === s.daysMax ? `${s.daysMin} day` : `${s.daysMin}–${s.daysMax} days`}
                  </td>
                  <td className="px-4 py-4 tabular-nums">{money(s.base)}</td>
                  <td className="px-4 py-4 tabular-nums">{money(s.perLb)}</td>
                  <td className="px-4 py-4 text-mist">{s.tagline}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-mist">
          Dimensional weight uses L × W × H ÷ 139. Tax is 7.5%. Fuel is 4.2% of subtotal plus a $4.95 handling fee.
        </p>
        <Button asChild className="mt-6">
          <Link to="/quote">Get a live quote</Link>
        </Button>
      </Container>
    </Page>
  );
}
