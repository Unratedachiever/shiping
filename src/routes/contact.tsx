import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Page, PageHeader, Container } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label, FieldError } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/select";
import { Textarea } from "@/components/ui/input";
import { submitContact } from "@/lib/server/contact";

export const Route = createFileRoute("/contact")({ component: ContactPage });

function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("shipment");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await submitContact({ data: { name, email, topic, message } });
      setSent(true);
      toast.success("Message received. A specialist will follow up.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Page>
      <PageHeader
        kicker="Contact"
        title="Talk to SwiftShip"
        description="Billing, claims, pickup windows, or a delayed shipment — send a note or call the desk."
      />
      <Container className="grid gap-8 py-10 lg:grid-cols-2">
        <div className="space-y-4">
          <Card className="rounded-xl">
            <CardContent className="p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-mist">Customer care</p>
              <p className="mt-2 font-display text-2xl font-semibold">1-800-SWIFT-SHIP</p>
              <p className="mt-1 text-sm text-mist">Mon–Fri 6:00–21:00 PT · Sat 8:00–16:00 PT</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl">
            <CardContent className="p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-mist">Headquarters</p>
              <p className="mt-2 font-medium">4100 E Bandini Blvd</p>
              <p className="text-sm text-mist">Los Angeles, CA 90040</p>
            </CardContent>
          </Card>
        </div>
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Send a message</CardTitle>
          </CardHeader>
          <CardContent>
            {sent ? (
              <p className="text-sm text-success">Thanks. We logged your message and will reply by email.</p>
            ) : (
              <form onSubmit={onSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="topic">Topic</Label>
                  <NativeSelect id="topic" value={topic} onChange={(e) => setTopic(e.target.value)}>
                    <option value="shipment">Shipment status</option>
                    <option value="billing">Billing</option>
                    <option value="pickup">Pickup request</option>
                    <option value="claims">Claims</option>
                    <option value="other">Something else</option>
                  </NativeSelect>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="msg">Message</Label>
                  <Textarea id="msg" value={message} onChange={(e) => setMessage(e.target.value)} required minLength={10} />
                </div>
                <FieldError>{error}</FieldError>
                <Button type="submit" disabled={busy}>
                  {busy ? "Sending…" : "Send"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </Container>
    </Page>
  );
}
