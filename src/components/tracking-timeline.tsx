import { Check } from "lucide-react";
import { TIMELINE_STEPS, timelineIndex, type ShipmentStatus } from "@/lib/status";
import { formatDate, formatTime, cn } from "@/lib/utils";
import type { TrackingEvent } from "@/lib/types";

export function TrackingTimeline({
  status,
  events,
}: {
  status: ShipmentStatus;
  events: TrackingEvent[];
}) {
  const current = timelineIndex(status);
  const delayed = status === "delayed" || status === "exception";

  return (
    <ol className="relative space-y-0">
      {TIMELINE_STEPS.map((step, i) => {
        const done = i < current || (i === current && status === "delivered");
        const active = i === current && status !== "delivered";
        const event = [...events].reverse().find((e) => {
          const idx = TIMELINE_STEPS.findIndex((s) => s.key === e.status);
          return idx === i || (e.status === step.key);
        });
        return (
          <li key={step.key} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "grid size-8 place-items-center rounded-full border text-xs font-medium",
                  done && "border-teal bg-teal text-paper",
                  active && !delayed && "border-teal bg-accent text-teal",
                  active && delayed && "border-warning bg-warning/15 text-warning",
                  !done && !active && "border-line bg-card text-mist",
                )}
              >
                {done ? <Check className="size-3.5" strokeWidth={2.5} /> : i + 1}
              </span>
              {i < TIMELINE_STEPS.length - 1 ? (
                <span
                  className={cn(
                    "w-px flex-1 min-h-8",
                    i < current ? "bg-teal" : "bg-line",
                  )}
                />
              ) : null}
            </div>
            <div className={cn("pb-8", i === TIMELINE_STEPS.length - 1 && "pb-0")}>
              <p
                className={cn(
                  "font-medium",
                  done || active ? "text-ink" : "text-mist",
                )}
              >
                {step.label}
              </p>
              {event ? (
                <p className="mt-1 text-sm text-mist">
                  {formatDate(event.occurredAt)} · {formatTime(event.occurredAt)} · {event.location}
                </p>
              ) : active ? (
                <p className="mt-1 text-sm text-mist">Current step</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function EventLog({ events }: { events: TrackingEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-mist">No scan events yet.</p>;
  }
  const ordered = [...events].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );
  return (
    <ol className="divide-y divide-line">
      {ordered.map((e) => (
        <li key={e.id} className="py-4 first:pt-0 last:pb-0">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-medium text-ink">{e.location}</p>
            <p className="text-xs tabular-nums text-mist">
              {formatDate(e.occurredAt)} · {formatTime(e.occurredAt)}
            </p>
          </div>
          <p className="mt-1 text-sm text-mist">{e.description}</p>
        </li>
      ))}
    </ol>
  );
}
