import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { AdminShell } from "@/components/layout/admin-guard";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { adminSearchCustomers, adminSetRole } from "@/lib/server/admin";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/admin/customers")({ component: AdminCustomers });

type Row = {
  userId: string;
  role: string;
  fullName: string | null;
  phone: string | null;
  company: string | null;
  createdAt: string;
  shipments: number;
};

function AdminCustomers() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  function reload(next = q) {
    void adminSearchCustomers({ data: { q: next } }).then(setRows);
  }
  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AdminShell>
      <h1 className="font-display text-2xl font-semibold">Customers</h1>
      <p className="mt-1 text-sm text-mist">Open a profile for shipments and addresses, or toggle staff access.</p>
      <Input
        className="mt-4"
        placeholder="Search name, phone, company"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          reload(e.target.value);
        }}
        aria-label="Search customers"
      />
      <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-card shadow-card">
        <table className="data-table min-w-[640px]">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Role</th>
              <th>Shipments</th>
              <th>Joined</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.userId}>
                <td>
                  <Link to="/admin/customers/$userId" params={{ userId: r.userId }} className="font-medium text-teal">
                    {r.fullName || r.userId.slice(0, 10)}
                  </Link>
                  <p className="text-xs text-mist">{r.company || r.phone || ""}</p>
                </td>
                <td className="capitalize">{r.role}</td>
                <td className="tabular-nums">{r.shipments}</td>
                <td>{formatDate(r.createdAt)}</td>
                <td className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const next = r.role === "admin" ? "customer" : "admin";
                      void adminSetRole({ data: { userId: r.userId, role: next } })
                        .then(() => {
                          toast.success("Role updated.");
                          reload();
                        })
                        .catch((e) => toast.error(e instanceof Error ? e.message : "Failed."));
                    }}
                  >
                    {r.role === "admin" ? "Make customer" : "Make admin"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No customers yet" description="Accounts appear after sign-in." />
          </div>
        ) : null}
      </div>
    </AdminShell>
  );
}
