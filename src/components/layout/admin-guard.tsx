import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { DashShell, ADMIN_LINKS } from "./dash-shell";
import { getMyProfile } from "@/lib/server/account";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminShell({ children }: { children: ReactNode }) {
  const [state, setState] = useState<"loading" | "admin" | "deny">("loading");

  useEffect(() => {
    void getMyProfile()
      .then((r) => setState(r.profile.role === "admin" ? "admin" : "deny"))
      .catch(() => setState("deny"));
  }, []);

  if (state === "loading") {
    return (
      <DashShell title="Operations" links={ADMIN_LINKS}>
        <Skeleton className="h-48" />
      </DashShell>
    );
  }
  if (state === "deny") return <Navigate to="/account" />;
  return (
    <DashShell title="Operations" links={ADMIN_LINKS}>
      {children}
    </DashShell>
  );
}
