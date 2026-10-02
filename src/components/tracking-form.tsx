import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function TrackingForm({
  variant = "hero",
  initial = "",
}: {
  variant?: "hero" | "page";
  initial?: string;
}) {
  const [value, setValue] = useState(initial);
  const navigate = useNavigate();

  function submit(e: FormEvent) {
    e.preventDefault();
    const n = value.trim().toUpperCase();
    if (!n) return;
    void navigate({ to: "/track/$trackingNumber", params: { trackingNumber: n } });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Tracking number (SWF…)"
        aria-label="Tracking number"
        className={cn("h-12 bg-card", variant === "hero" && "sm:flex-1")}
      />
      <Button type="submit" size="lg" className="h-12 shrink-0">
        <Search className="size-4" />
        Track package
      </Button>
    </form>
  );
}
