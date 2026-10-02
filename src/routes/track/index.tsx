import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, MapPinned, ScanLine } from "lucide-react";
import { Page, PageHeader, Container } from "@/components/layout/page";
import { TrackingForm } from "@/components/tracking-form";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/track/")({ component: TrackIndex });

const TIPS = [
  {
    icon: ScanLine,
    title: "Use the number on your label",
    copy: "SwiftShip tracking numbers start with SWF, followed by nine digits.",
  },
  {
    icon: MapPinned,
    title: "Scans post in real time",
    copy: "Pickup, sort, linehaul, and delivery events appear as soon as a facility records them.",
  },
  {
    icon: Bell,
    title: "Stay notified",
    copy: "Sign in to receive delay and delivery notices on your account dashboard.",
  },
];

function TrackIndex() {
  return (
    <Page>
      <PageHeader
        kicker="Tracking"
        title="Follow every scan"
        description="Enter a SwiftShip tracking number to see live status, facility history, and the route from origin to destination."
      />
      <Container className="py-10">
        <Card className="rounded-xl">
          <CardContent className="p-6">
            <TrackingForm variant="page" />
            <p className="mt-3 text-sm text-mist">
              Missing a number? Check your shipping confirmation, or{" "}
              <Link to="/contact" className="text-teal">
                contact the desk
              </Link>
              .
            </p>
          </CardContent>
        </Card>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {TIPS.map((tip) => (
            <div key={tip.title} className="rounded-xl border border-line bg-card p-5">
              <span className="grid size-10 place-items-center rounded-md bg-accent text-teal">
                <tip.icon className="size-5" />
              </span>
              <h2 className="mt-4 font-display text-lg font-semibold">{tip.title}</h2>
              <p className="mt-1 text-sm text-mist">{tip.copy}</p>
            </div>
          ))}
        </div>
      </Container>
    </Page>
  );
}
