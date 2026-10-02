import { createFileRoute, Link } from "@tanstack/react-router";
import { Page, PageHeader, Container } from "@/components/layout/page";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/freight")({ component: FreightPage });

function FreightPage() {
  return (
    <Page>
      <PageHeader
        kicker="Freight"
        title="Pallets, not just parcels"
        description="Book a crate or freight package type from Ship Now. Dimensional weight and handling are priced in the quote."
      />
      <Container className="py-12">
        <img src="/images/sortation.jpg" alt="Sortation warehouse" className="max-h-80 w-full rounded-xl object-cover" />
        <p className="mt-6 max-w-2xl text-mist">
          Select package type “Crate / Freight” when booking. Liftgate, inside delivery, and appointment windows
          can be noted in the contents description for operations.
        </p>
        <Button asChild className="mt-6">
          <Link to="/ship">Book freight</Link>
        </Button>
      </Container>
    </Page>
  );
}
