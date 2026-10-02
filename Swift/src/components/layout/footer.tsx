import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/logo";

const COLS = [
  {
    title: "Ship",
    links: [
      { to: "/ship", label: "Create a shipment" },
      { to: "/quote", label: "Get a quote" },
      { to: "/track", label: "Track a package" },
      { to: "/pricing", label: "Rates" },
    ],
  },
  {
    title: "Network",
    links: [
      { to: "/services", label: "Services" },
      { to: "/locations", label: "Locations" },
      { to: "/freight", label: "Freight" },
      { to: "/returns", label: "Returns" },
    ],
  },
  {
    title: "Company",
    links: [
      { to: "/about", label: "About" },
      { to: "/business", label: "Business" },
      { to: "/contact", label: "Contact" },
      { to: "/help", label: "Help center" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="bg-navy text-paper">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-5">
        <div className="md:col-span-2">
          <Logo inverted />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-paper/70">
            Fast, secure worldwide delivery. From a single parcel to a freight program, SwiftShip
            moves what matters — and shows you every mile.
          </p>
          <p className="mt-6 text-sm font-medium">1-800-SWIFT-SHIP</p>
          <p className="text-sm text-paper/60">Mon–Fri 6:00–21:00 PT · Sat 8:00–16:00 PT</p>
        </div>
        {COLS.map((col) => (
          <div key={col.title}>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-paper/50">{col.title}</p>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-paper/80 hover:text-paper">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-paper/50 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} SwiftShip Logistics. All rights reserved.</p>
          <p>Secure checkout · Full card numbers are never stored.</p>
        </div>
      </div>
    </footer>
  );
}
