import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminShell } from "@/components/layout/admin-guard";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { adminGetCustomer } from "@/lib/server/admin";
import { formatDate, money } from "@/lib/utils";
import type { AdminCustomerDetail } from "@/lib/types";

export const Route = createFileRoute("/admin/customers/$userId")({ component: AdminCustomerDetailPage });

function AdminCustomerDetailPage() {
  const { userId } = Route.useParams();
  const [detail, setDetail] = useState<AdminCustomerDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void adminGetCustomer({ data: { userId } })
      .then(setDetail)
      .catch((e) => setError(e instanceof Error ? e.message : "Not found"));
  }, [userId]);

  return (
    <AdminShell>
      <p className="text-xs text-mist">
        <Link to="/admin/customers" className="hover:text-teal">
          Customers
        </Link>{" "}
        / {userId.slice(0, 12)}…
      </p>
      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
      {!detail && !error ? <Skeleton className="mt-4 h-48" /> : null}
      {detail ? (
        <div className="mt-4 space-y-4">
          <div>
            <h1 className="font-display text-2xl font-semibold">
              {detail.profile.fullName || "Unnamed customer"}
            </h1>
            <p className="text-sm text-mist">
              {detail.profile.company || "—"} · {detail.profile.phone || "No phone"} ·{" "}
              <span className="capitalize">{detail.profile.role}</span> · Joined {formatDate(detail.profile.createdAt)}
            </p>
            <p className="mt-1 text-sm">
              Lifetime payments: <span className="font-medium tabular-nums">{money(detail.paymentsTotal)}</span>
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle>Shipments ({detail.shipments.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {detail.shipments.length === 0 ? (
                  <p className="text-sm text-mist">No shipments linked.</p>
                ) : (
                  detail.shipments.map((s) => (
                    <Link
                      key={s.id}
                      to="/admin/shipments/$id"
                      params={{ id: s.id }}
                      className="flex items-center justify-between gap-2 rounded-md border border-line p-3"
                    >
                      <div>
                        <p className="font-mono text-xs">{s.trackingNumber}</p>
                        <p className="text-sm text-mist">
                          {s.sender.city} → {s.recipient.city}
                        </p>
                      </div>
                      <StatusBadge status={s.status} />
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle>Saved addresses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {detail.addresses.length === 0 ? (
                  <p className="text-mist">No saved addresses.</p>
                ) : (
                  detail.addresses.map((a) => (
                    <div key={a.id}>
                      <p className="font-medium">
                        {a.label} {a.isDefault ? <span className="text-xs text-teal">Default</span> : null}
                      </p>
                      <p className="text-mist">
                        {a.fullName} · {a.street}, {a.city}, {a.state} {a.postalCode}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
