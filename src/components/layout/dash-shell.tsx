import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Header } from "./header";
import { Footer } from "./footer";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function DashShell({
  children,
  links,
  title,
}: {
  children: ReactNode;
  links: { to: string; label: string }[];
  title: string;
}) {
  const { user, isPending } = useCurrentUserState();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (isPending) {
    return (
      <div className="flex min-h-screen flex-col bg-paper">
        <Header />
        <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="mt-6 h-64" />
        </div>
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <Header />
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:flex-row">
        <aside className="lg:w-52">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-mist">{title}</p>
          <nav className="mt-3 flex gap-1 overflow-x-auto lg:flex-col">
            {links.map((l) => {
              const active = pathname === l.to || (l.to !== "/account" && l.to !== "/admin" && pathname.startsWith(l.to));
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={cn(
                    "shrink-0 rounded-md px-3 py-2 text-sm",
                    active ? "bg-accent text-navy" : "text-mist hover:text-navy",
                  )}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
      <Footer />
    </div>
  );
}

export const ACCOUNT_LINKS = [
  { to: "/account", label: "Overview" },
  { to: "/account/shipments", label: "Shipments" },
  { to: "/account/addresses", label: "Addresses" },
  { to: "/account/billing", label: "Billing" },
  { to: "/account/notifications", label: "Notifications" },
  { to: "/account/preferences", label: "Delivery prefs" },
  { to: "/account/settings", label: "Account" },
];

export const ADMIN_LINKS = [
  { to: "/admin", label: "Overview" },
  { to: "/admin/shipments", label: "Shipments" },
  { to: "/admin/create", label: "Create" },
  { to: "/admin/payments", label: "Payments" },
  { to: "/admin/locations", label: "Locations" },
  { to: "/admin/inbox", label: "Inbox" },
  { to: "/admin/customers", label: "Staff & customers" },
  { to: "/admin/activity", label: "Activity log" },
];
