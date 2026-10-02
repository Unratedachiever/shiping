import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-navy" />
      <path
        d="M7 20.5 16 8.5 25 20.5h-4.2L16 14.2 11.2 20.5H7Z"
        className="fill-paper"
      />
      <path d="M11.5 22.5h9L16 16.6 11.5 22.5Z" className="fill-teal-2" />
    </svg>
  );
}

export function Logo({
  inverted = false,
  compact = false,
}: {
  inverted?: boolean;
  compact?: boolean;
}) {
  return (
    <Link to="/" className="flex items-center gap-2.5 min-h-11">
      <Mark />
      {compact ? null : (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              "font-display text-[15px] font-bold tracking-tight",
              inverted ? "text-paper" : "text-navy",
            )}
          >
            SwiftShip
          </span>
          <span
            className={cn(
              "text-[10px] font-medium uppercase tracking-[0.18em]",
              inverted ? "text-paper/70" : "text-mist",
            )}
          >
            Logistics
          </span>
        </span>
      )}
    </Link>
  );
}
