import { createFileRoute } from "@tanstack/react-router";
import { Page, PageHeader, Container } from "@/components/layout/page";

export const Route = createFileRoute("/about")({ component: AboutPage });

function AboutPage() {
  return (
    <Page>
      <PageHeader
        kicker="Company"
        title="Built for the operators in the room"
        description="SwiftShip Logistics is an independent carrier platform — original identity, original network story, no borrowed purple."
      />
      <Container className="max-w-3xl py-12">
        <div className="overflow-hidden rounded-xl">
          <img src="/images/hub-dawn.jpg" alt="SwiftShip distribution hub at dawn" className="w-full object-cover" />
        </div>
        <p className="mt-8 text-lg leading-relaxed text-ink">
          We started as a West Coast sortation team that was tired of tracking pages that lied. SwiftShip is the
          product we wanted: a public tracking surface, a booking desk that prices honestly, and an operations
          console that posts scans the moment they happen.
        </p>
        <p className="mt-4 leading-relaxed text-mist">
          Today the network spans 86 distribution centers and 220 countries, with a super-hub in Memphis and
          international gateways in Miami, London, and Toronto. Create a shipment, pay the label, and follow
          every scan from origin to the door.
        </p>
      </Container>
    </Page>
  );
}
