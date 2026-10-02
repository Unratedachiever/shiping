import { useState, type FormEvent } from "react";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/label";

export function ProviderButtons({ callbackURL = "/account" }: { callbackURL?: string }) {
  const [busy, setBusy] = useState<string | null>(null);
  if (!authEnabled) {
    return <p className="text-sm text-mist">Sign-in is disabled.</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      {GROK_PROVIDERS.map((p) => (
        <Button
          key={p.providerId}
          type="button"
          variant="outline"
          disabled={busy !== null}
          onClick={() => {
            setBusy(p.providerId);
            void signIn(p.providerId, { callbackURL }).catch(() => setBusy(null));
          }}
        >
          {busy === p.providerId ? "Connecting…" : `Continue with ${p.label}`}
        </Button>
      ))}
    </div>
  );
}

export function EmailAuthForm({ mode }: { mode: "login" | "register" }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "register") {
        const { error: err } = await authClient.signUp.email({
          email,
          password,
          name: name || email.split("@")[0] || "Customer",
          callbackURL: "/account",
        });
        if (err) throw new Error(err.message ?? "Could not create account.");
      } else {
        const { error: err } = await authClient.signIn.email({
          email,
          password,
          callbackURL: "/account",
        });
        if (err) throw new Error(err.message ?? "Could not sign in.");
      }
      window.location.href = "/account";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {mode === "register" ? (
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
        </div>
      ) : null}
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete={mode === "register" ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
      </div>
      <FieldError>{error}</FieldError>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "Please wait…" : mode === "register" ? "Create account" : "Sign in"}
      </Button>
    </form>
  );
}
