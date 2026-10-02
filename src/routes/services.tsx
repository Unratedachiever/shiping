import { createFileRoute, Link } from "@tanstack/react-router";
import { Page, PageHeader, Container } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SERVICES } from "@/lib/cities";

export const Route = createFileRoute("/services")({ component: ServicesPage });

const EXTRAS = [
  { title: "Freight", copy: "Pallets and LTL with scheduled appointments and liftgate options.", to: "/freight" },
  { title: "Returns", copy: "Prepaid return labels and hold-for-pickup windows.", to: "/returns" },
  { title: "Business", copy: "Volume rates, pickup programs, and a shared operations inbox.", to: "/business" },
];

function ServicesPage() {
  return (
    <Page>
      <PageHeader
        kicker="Services"
        title="One network, four speeds"
        description="Pick a product by time, or start with a quote and we’ll show every option that can make the window."
      />
      <Container className="py-10">
        <div className="grid gap-4 md:grid-cols-2">
          {Object.values(SERVICES).map((s) => (
            <Card key={s.code} className="rounded-xl">
              <CardContent className="p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal">{s.tagline}</p>
                <h2 className="mt-2 font-display text-2xl font-semibold">{s.name}</h2>
                <p className="mt-2 text-mist">{s.description}</p>
                <p className="mt-4 text-sm text-mist">
                  {s.daysMin === s.daysMax ? `${s.daysMin} business day` : `${s.daysMin}–${s.daysMax} business days`}
                </p>
                <Button asChild className="mt-5" variant="outline">
                  <Link to="/quote">Get a {s.name} quote</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-10 overflow-hidden rounded-xl">
          <img src="/images/porch-delivery.jpg" alt="Package delivered to a porch" className="max-h-80 w-full object-cover" />
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {EXTRAS.map((e) => (
            <Link key={e.title} to={e.to} className="rounded-xl border border-line bg-card p-5 hover:border-teal/40">
              <h3 className="font-display text-lg font-semibold">{e.title}</h3>
              <p className="mt-2 text-sm text-mist">{e.copy}</p>
            </Link>
          ))}
        </div>
      </Container>
    </Page>
  );
}
