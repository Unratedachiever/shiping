import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { DashShell, ACCOUNT_LINKS } from "@/components/layout/dash-shell";
import { AddressFields, emptyAddress } from "@/components/address-fields";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteAddress, listMyAddresses, saveAddress, setDefaultAddress } from "@/lib/server/account";
import type { AddressInput, SavedAddress } from "@/lib/types";

export const Route = createFileRoute("/account/addresses")({ component: AddressesPage });

function AddressesPage() {
  const [rows, setRows] = useState<SavedAddress[]>([]);
  const [label, setLabel] = useState("Home");
  const [addr, setAddr] = useState<AddressInput>(emptyAddress());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [makeDefault, setMakeDefault] = useState(false);

  function reload() {
    void listMyAddresses().then(setRows);
  }
  useEffect(() => {
    reload();
  }, []);

  function startEdit(r: SavedAddress) {
    setEditingId(r.id);
    setLabel(r.label);
    setAddr({
      fullName: r.fullName,
      phone: r.phone,
      email: r.email,
      street: r.street,
      city: r.city,
      state: r.state,
      postalCode: r.postalCode,
      country: r.country,
    });
    setMakeDefault(r.isDefault);
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setLabel("Home");
    setAddr(emptyAddress());
    setMakeDefault(false);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await saveAddress({
        data: {
          ...addr,
          id: editingId ?? undefined,
          label,
          isDefault: makeDefault || rows.length === 0,
        },
      });
      toast.success(editingId ? "Address updated." : "Address saved.");
      resetForm();
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save.");
    }
  }

  return (
    <DashShell title="Account" links={ACCOUNT_LINKS}>
      <h1 className="font-display text-2xl font-semibold">Saved addresses</h1>
      <p className="mt-1 text-sm text-mist">Set a default for faster checkout. Edit or remove anytime.</p>
      <div className="mt-4 space-y-2">
        {rows.length === 0 ? (
          <EmptyState title="No saved addresses yet" description="Add a home or office address to reuse on Ship Now." />
        ) : null}
        {rows.map((r) => (
          <Card key={r.id} className="rounded-xl">
            <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
              <div>
                <p className="font-medium">
                  {r.label}{" "}
                  {r.isDefault ? (
                    <span className="ml-1 rounded-full bg-accent px-2 py-0.5 text-xs text-teal">Default</span>
                  ) : null}
                </p>
                <p className="text-sm text-mist">
                  {r.fullName} · {r.street}, {r.city}, {r.state} {r.postalCode}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {!r.isDefault ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      void setDefaultAddress({ data: { id: r.id } })
                        .then(() => {
                          toast.success("Default updated.");
                          reload();
                        })
                        .catch((e) => toast.error(e instanceof Error ? e.message : "Failed."));
                    }}
                  >
                    Make default
                  </Button>
                ) : null}
                <Button variant="outline" size="sm" onClick={() => startEdit(r)}>
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (!confirm("Remove this address?")) return;
                    void deleteAddress({ data: { id: r.id } })
                      .then(() => {
                        toast.success("Removed.");
                        reload();
                      })
                      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed."));
                  }}
                >
                  Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-6 rounded-xl">
        <CardHeader>
          <CardTitle>{editingId ? "Edit address" : "Add address"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="label">Label</Label>
              <Input id="label" value={label} onChange={(e) => setLabel(e.target.value)} required />
            </div>
            <AddressFields id="saved" value={addr} onChange={setAddr} />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={makeDefault}
                onChange={(e) => setMakeDefault(e.target.checked)}
                className="size-4 rounded border-line"
              />
              Set as default address
            </label>
            <div className="flex flex-wrap gap-2">
              <Button type="submit">{editingId ? "Update address" : "Save address"}</Button>
              {editingId ? (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>
    </DashShell>
  );
}
