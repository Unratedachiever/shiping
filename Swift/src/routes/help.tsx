import { createFileRoute, Link } from "@tanstack/react-router";
import { Page, PageHeader, Container } from "@/components/layout/page";

export const Route = createFileRoute("/help")({ component: HelpPage });

const ITEMS = [
  {
    q: "Where is my package?",
    a: "Open Track and enter the SwiftShip number from your label or confirmation email. The page refreshes as operations posts each new scan.",
  },
  {
    q: "How do I create a shipment?",
    a: "Use Ship to enter origin, destination, and package details. Choose a service, pay the label, and you receive a tracking number immediately — with or without an account.",
  },
  {
    q: "What if my shipment is delayed?",
    a: "Exception statuses appear on the tracking timeline with the latest facility and a revised delivery window. Signed-in customers also get an in-app notice.",
  },
  {
    q: "How do payments work?",
    a: "Pay by card, invoice, or the method on your account. We never store full card numbers — only brand and last four digits for your receipt.",
  },
  {
    q: "Can my team use the operations console?",
    a: "Yes. The first signed-in operator can activate staff access from Account. Additional operators are promoted from the customers list.",
  },
  {
    q: "How do I file a claim or request a pickup?",
    a: "Use Contact and choose Claims or Pickup. The desk is staffed Mon–Fri 6:00–21:00 PT and Saturday 8:00–16:00 PT.",
  },
];

function HelpPage() {
  return (
    <Page>
      <PageHeader kicker="Help center" title="Guides for shippers and operators" />
      <Container className="max-w-3xl py-12">
        <div className="divide-y divide-line">
          {ITEMS.map((i) => (
            <div key={i.q} className="py-5">
              <h2 className="font-medium">{i.q}</h2>
              <p className="mt-2 text-sm text-mist">{i.a}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-sm text-mist">
          Need a person?{" "}
          <Link to="/contact" className="text-teal">
            Contact the desk
          </Link>
          .
        </p>
      </Container>
    </Page>
  );
}
