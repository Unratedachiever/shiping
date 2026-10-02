import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeftRight, MapPin, Package, ShieldCheck } from "lucide-react";
import { Page, PageHeader, Container } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/returns")({ component: ReturnsPage });

const STEPS = [
  {
    icon: ArrowLeftRight,
    title: "Reverse the addresses",
    copy: "Open Ship Now and set the original recipient as the sender. Use the original sender as the return destination.",
  },
  {
    icon: Package,
    title: "Choose Ground unless urgent",
    copy: "Most returns move on SwiftShip Ground. Use Express only when the merchant requires a faster window.",
  },
  {
    icon: MapPin,
    title: "Drop at a pickup point",
    copy: "Print your label, pack securely, and drop at any SwiftShip pickup or service center. Hold-at-location is available for merchant returns.",
  },
  {
    icon: ShieldCheck,
    title: "Track the return",
    copy: "The return gets its own SWF tracking number. Share it with the merchant so both sides see the same timeline.",
  },
];

const FAQS = [
  {
    q: "Do I need the original tracking number?",
    a: "Helpful, but not required. Reference it in the package description so ops and the merchant can reconcile the return.",
  },
  {
    q: "Can I hold a return at a location?",
    a: "Yes. Choose a pickup point on the Locations page and note it in delivery instructions, or set hold preferences under Account → Delivery prefs.",
  },
  {
    q: "Are returns insured?",
    a: "Declared value works the same as outbound shipments. Enter the merchandise value when creating the return label.",
  },
];

function ReturnsPage() {
  return (
    <Page>
      <PageHeader
        kicker="Returns"
        title="Send it back on the same network"
        description="Create a return shipment with the original recipient as the sender. Hold-at-location is available at pickup points."
      />
      <Container className="py-12">
        <div className="grid gap-4 sm:grid-cols-2">
          {STEPS.map((s) => (
            <Card key={s.title} className="rounded-xl shadow-card">
              <CardContent className="flex gap-4 p-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-md bg-accent text-teal">
                  <s.icon className="size-5" />
                </span>
                <div>
                  <h2 className="font-medium">{s.title}</h2>
                  <p className="mt-1 text-sm text-mist">{s.copy}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/ship">Create a return</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/locations">Find a drop-off</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/account/preferences">Delivery preferences</Link>
          </Button>
        </div>
        <div className="mt-12 divide-y divide-line rounded-xl border border-line bg-card px-5">
          {FAQS.map((f) => (
            <details key={f.q} className="group py-4">
              <summary className="cursor-pointer list-none font-medium">{f.q}</summary>
              <p className="mt-2 text-sm text-mist">{f.a}</p>
            </details>
          ))}
        </div>
      </Container>
    </Page>
  );
}
