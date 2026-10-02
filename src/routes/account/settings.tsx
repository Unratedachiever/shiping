import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { DashShell, ACCOUNT_LINKS } from "@/components/layout/dash-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getMyProfile, updateMyProfile } from "@/lib/server/account";
import { useCurrentUser } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/account/settings")({ component: SettingsPage });

function SettingsPage() {
  const user = useCurrentUser();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");

  useEffect(() => {
    void getMyProfile().then((r) => {
      setFullName(r.profile.fullName ?? user?.displayName ?? "");
      setPhone(r.profile.phone ?? "");
      setCompany(r.profile.company ?? "");
    });
  }, [user]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await updateMyProfile({ data: { fullName, phone, company } });
      toast.success("Account updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save.");
    }
  }

  return (
    <DashShell title="Account" links={ACCOUNT_LINKS}>
      <h1 className="font-display text-2xl font-semibold">Account information</h1>
      <Card className="mt-4 rounded-xl">
        <CardContent className="p-6">
          <form onSubmit={onSubmit} className="max-w-md space-y-3">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={user?.primaryEmail ?? ""} disabled />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="n">Full name</Label>
              <Input id="n" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p">Phone</Label>
              <Input id="p" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c">Company</Label>
              <Input id="c" value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
            <Button type="submit">Save</Button>
          </form>
        </CardContent>
      </Card>
    </DashShell>
  );
}
