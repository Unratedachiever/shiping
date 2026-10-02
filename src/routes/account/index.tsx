import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { DashShell, ACCOUNT_LINKS } from "@/components/layout/dash-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { listMyShipments } from "@/lib/server/shipments";
import { getMyProfile, claimAdmin, listMyNotifications } from "@/lib/server/account";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import type { Shipment } from "@/lib/types";
import type { AppNotification, Profile } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/account/")({ component: AccountHome });

function AccountHome() {
  const user = useCurrentUser();
  const [shipments, setShipments] = useState<Shipment[] | null>(null);
  const [notes, setNotes] = useState<AppNotification[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [adminExists, setAdminExists] = useState(true);

  useEffect(() => {
    void listMyShipments().then(setShipments).catch(() => setShipments([]));
    void listMyNotifications().then(setNotes).catch(() => undefined);
    void getMyProfile()
      .then((r) => {
        setProfile(r.profile);
        setAdminExists(r.adminExists);
      })
      .catch(() => undefined);
  }, []);

  const active = shipments?.filter((s) => s.status !== "delivered") ?? [];
  const delivered = shipments?.filter((s) => s.status === "delivered") ?? [];

  return (
    <DashShell title="Account" links={ACCOUNT_LINKS}>
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        Hello{user?.displayName ? `, ${user.displayName}` : ""}
      </h1>
      <p className="mt-1 text-sm text-mist">Your shipments, notices, and billing live here.</p>
      {!shipments ? (
        <Skeleton className="mt-6 h-40" />
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Stat label="Active" value={String(active.length)} />
          <Stat label="Delivered" value={String(delivered.length)} />
          <Stat label="Unread notices" value={String(notes.filter((n) => !n.read).length)} />
        </div>
      )}
      {profile?.role === "admin" ? (
        <Button asChild className="mt-6" variant="navy">
          <Link to="/admin">Open operations console</Link>
        </Button>
      ) : !adminExists ? (
        <Card className="mt-6 rounded-xl">
          <CardContent className="p-5">
            <p className="font-medium">No staff administrator yet</p>
            <p className="mt-1 text-sm text-mist">Activate the operations console on this account to manage the network.</p>
            <Button
              className="mt-3"
              variant="outline"
              onClick={() => {
                void claimAdmin()
                  .then(() => {
                    toast.success("Staff access enabled.");
                    window.location.href = "/admin";
                  })
                  .catch((e) => toast.error(e instanceof Error ? e.message : "Could not enable staff access."));
              }}
            >
              Activate staff access
            </Button>
          </CardContent>
        </Card>
      ) : null}
      <h2 className="mt-8 font-display text-lg font-semibold">Active shipments</h2>
      <div className="mt-3 space-y-2">
        {shipments && active.length === 0 ? (
          <p className="text-sm text-mist">
            No active shipments.{" "}
            <Link to="/ship" className="text-teal">
              Create one
            </Link>
            .
          </p>
        ) : (
          active.slice(0, 6).map((s) => (
            <Link
              key={s.id}
              to="/account/shipments/$id"
              params={{ id: s.id }}
              className="flex items-center justify-between gap-3 rounded-lg border border-line bg-card p-4"
            >
              <div>
                <p className="font-mono text-sm">{s.trackingNumber}</p>
                <p className="text-sm text-mist">
                  {s.sender.city} → {s.recipient.city}
                </p>
              </div>
              <StatusBadge status={s.status} />
            </Link>
          ))
        )}
      </div>
    </DashShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="rounded-xl">
      <CardContent className="p-5">
        <p className="font-display text-2xl font-semibold tabular-nums">{value}</p>
        <p className="mt-1 text-sm text-mist">{label}</p>
      </CardContent>
    </Card>
  );
}
