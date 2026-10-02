==import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Box,
  Building2,
  Clock,
  Globe2,
  MapPin,
  PackageSearch,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { Page } from "@/components/layout/page";
import { TrackingForm } from "@/components/tracking-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/")({ component: Home });

const STATS = [
  { value: "184M+", label: "Shipments delivered" },
  { value: "220", label: "Countries served" },
  { value: "86", label: "Distribution centers" },
  { value: "99.4%", label: "On-time satisfaction" },
];

const ACTIONS = [
  { to: "/track", title: "Track a shipment", copy: "Live status, scan history, and route.", icon: PackageSearch },
  { to: "/ship", title: "Create a shipment", copy: "From a single parcel to a freight pallet.", icon: Box },
  { to: "/quote", title: "Get a quote", copy: "Compare Ground, Express, Overnight, Worldwide.", icon: Clock },
  { to: "/locations", title: "Find a location", copy: "Hubs, drop-off points, and holds.", icon: MapPin },
];

const SERVICES = [
  { title: "Ground", copy: "Day-definite continental delivery with dense last-mile coverage.", to: "/services" },
  { title: "Express", copy: "Two- and three-day air for inventory that cannot wait.", to: "/services" },
  { title: "Overnight", copy: "Next-business-morning windows in major metros.", to: "/services" },
  { title: "Worldwide", copy: "Customs-ready international with brokerage included.", to: "/services" },
];

const FAQS = [
  {
    q: "How do I track a package?",
    a: "Enter your SwiftShip tracking number (it starts with SWF) on the homepage or Track page. Status updates as soon as a facility posts a scan.",
  },
  {
    q: "What if my shipment is delayed?",
    a: "Delayed and exception statuses appear on the tracking timeline with the latest facility and a revised estimated delivery. Signed-in customers also receive an in-app notice.",
  },
  {
    q: "Can I ship without an account?",
    a: "Yes. Guest checkout creates a tracking number instantly. An account saves addresses, billing methods, and history.",
  },
  {
    q: "How are rates calculated?",
    a: "Quotes combine billable weight (actual vs dimensional), distance between origin and destination, and service speed. Fuel and handling appear as separate fees.",
  },
  {
    q: "Do you store card numbers?",
    a: "No. We never store full card numbers. Checkout keeps only the last four digits for your receipt.",
  },
];

const STORIES = [
  {
    quote: "We moved our replenishment to SwiftShip Express and cut two days off every West Coast restock.",
    name: "Elena Voss",
    role: "Head of Logistics, Northwind Studio",
  },
  {
    quote: "The tracking timeline is what we show customers. When a status changes, they see it without calling us.",
    name: "Marcus Hale",
    role: "Operations, Harbor House Kitchen",
  },
  {
    quote: "International used to mean a spreadsheet. Brokerage included on Worldwide is the reason we switched.",
    name: "Priya Shah",
    role: "Founder, Kite Paper Co.",
  },
];

function Home() {
  return (
    <Page>
      <section className="relative isolate overflow-hidden bg-navy text-paper">
        <img
          src="/images/hub-dawn.jpg"
          alt=""
          className="absolute inset-0 size-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/85 to-navy/40" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-2">Worldwide logistics</p>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Ship anything. Track everything.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-paper/75 sm:text-lg">
              Fast, secure delivery across 220 countries. From a labeled envelope to a freight program,
              SwiftShip keeps every scan, delay, and proof of delivery in one place.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-navy/70 p-5 shadow-card backdrop-blur-sm sm:p-6">
            <p className="text-sm font-medium">Track a shipment</p>
            <p className="mt-1 text-sm text-paper/60">Use a SwiftShip tracking number (SWF…)</p>
            <div className="mt-4">
              <TrackingForm />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild variant="linen" size="sm">
                <Link to="/ship">Ship a package</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="border-white/20 text-paper hover:bg-white/10">
                <Link to="/quote">Compare rates</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ACTIONS.map((a) => (
            <Link key={a.to} to={a.to} className="group">
              <Card className="h-full rounded-xl transition-transform duration-200 group-hover:-translate-y-0.5">
                <CardContent className="p-5">
                  <span className="grid size-10 place-items-center rounded-md bg-accent text-teal">
                    <a.icon className="size-5" />
                  </span>
                  <h2 className="mt-4 font-display text-lg font-semibold">{a.title}</h2>
                  <p className="mt-1 text-sm text-mist">{a.copy}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-teal">
                    Continue <ArrowRight className="size-3.5" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-card">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 sm:grid-cols-4 sm:px-6">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="font-display text-3xl font-semibold tabular-nums tracking-tight text-navy">{s.value}</p>
              <p className="mt-1 text-sm text-mist">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl">
          <img src="/images/sortation.jpg" alt="Parcel sortation warehouse" className="h-full w-full object-cover" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Services</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">A network built for certainty</h2>
          <p className="mt-3 text-mist">
            One operating picture from first-mile pickup to the porch. Choose a service, or let the
            quote engine pick based on time and cost.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {SERVICES.map((s) => (
              <Link key={s.title} to={s.to} className="rounded-lg border border-line bg-card p-4 hover:border-teal/40">
                <h3 className="font-medium">{s.title}</h3>
                <p className="mt-1 text-sm text-mist">{s.copy}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-navy text-paper">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <h2 className="font-display text-3xl font-semibold tracking-tight">How a shipment moves</h2>
            <p className="mt-3 text-paper/70">Eight visible steps. Status updates land on the tracking page as soon as operations posts them.</p>
          </div>
          <ol className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
            {[
              { icon: Box, t: "Create", d: "Label, rate, and pickup window in one booking." },
              { icon: Truck, t: "Collect", d: "Courier scan at the door or drop-off counter." },
              { icon: Building2, t: "Sort", d: "Facility processing with a departure event." },
              { icon: Globe2, t: "Linehaul", d: "Air and ground, including customs when needed." },
              { icon: MapPin, t: "Arrive", d: "Destination facility, then last-mile assignment." },
              { icon: ShieldCheck, t: "Deliver", d: "Proof of delivery with a signed scan." },
            ].map((s, i) => (
              <li key={s.t} className="flex gap-3 rounded-lg border border-white/10 p-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-md bg-white/5 text-teal-2">
                  <s.icon className="size-5" />
                </span>
                <div>
                  <p className="font-medium">
                    <span className="tabular-nums text-paper/40">{String(i + 1).padStart(2, "0")} · </span>
                    {s.t}
                  </p>
                  <p className="mt-1 text-sm text-paper/65">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-3xl font-semibold tracking-tight">Operators, not slogans</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {STORIES.map((s) => (
            <Card key={s.name} className="rounded-xl">
              <CardContent className="p-6">
                <p className="text-[15px] leading-relaxed text-ink">“{s.quote}”</p>
                <p className="mt-5 text-sm font-medium">{s.name}</p>
                <p className="text-sm text-mist">{s.role}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t border-line bg-card">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight">Questions, answered</h2>
            <p className="mt-3 text-mist">Still stuck? The help center and contact desk are staffed on business days.</p>
            <Button asChild className="mt-6" variant="outline">
              <Link to="/help">Open help center</Link>
            </Button>
          </div>
          <div className="divide-y divide-line">
            {FAQS.map((f) => (
              <details key={f.q} className="group py-4">
                <summary className="cursor-pointer list-none font-medium marker:content-none">
                  <span className="flex items-center justify-between gap-4">
                    {f.q}
                    <ArrowRight className="size-4 shrink-0 text-mist transition-transform group-open:rotate-90" />
                  </span>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-mist">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden">
        <img src="/images/van-sunrise.jpg" alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-navy/75" />
        <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="max-w-xl font-display text-3xl font-semibold text-paper sm:text-4xl">Ready to move it?</h2>
          <p className="max-w-lg text-paper/75">Get a rate in seconds, or hand us a tracking number and we’ll show you the network.</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="linen">
              <Link to="/ship">Ship now</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/20 text-paper hover:bg-white/10">
              <Link to="/quote">Get a quote</Link>
            </Button>
          </div>
        </div>
      </section>
    </Page>
  );
}
