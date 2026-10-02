import { createFileRoute, Link } from "@tanstack/react-router";
import { Page, PageHeader, Container } from "@/components/layout/page";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/business")({ component: BusinessPage });

function BusinessPage() {
  return (
    <Page>
      <PageHeader
        kicker="Business"
        title="Volume shipping without a war room"
        description="Daily pickups, multi-piece shipments, invoice billing, and a staff console for your logistics team."
      />
      <Container className="grid gap-8 py-12 lg:grid-cols-2">
        <ul className="space-y-4 text-mist">
          <li>
            <strong className="text-ink">Scheduled pickups.</strong> Recurring collection windows at your dock.
          </li>
          <li>
            <strong className="text-ink">Invoice terms.</strong> Pay on account instead of per label.
          </li>
          <li>
            <strong className="text-ink">Shared visibility.</strong> Every active shipment on one dashboard.
          </li>
          <li>
            <strong className="text-ink">Staff roles.</strong> Promote operators to the admin console when you are ready.
          </li>
        </ul>
        <div>
          <Button asChild>
            <Link to="/register">Open a business account</Link>
          </Button>
          <Button asChild variant="outline" className="ml-3">
            <Link to="/contact">Talk to sales</Link>
          </Button>
        </div>
      </Container>
    </Page>
  );
}
