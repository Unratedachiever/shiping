import { findCity } from "@/lib/cities";
import { timelineIndex, type ShipmentStatus } from "@/lib/status";
import { cn } from "@/lib/utils";

function project(lat: number, lng: number, w: number, h: number) {
  const pad = 56;
  const minLng = -128;
  const maxLng = -66;
  const minLat = 24;
  const maxLat = 50;
  const inUs = lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat;
  if (inUs) {
    const x = pad + ((lng - minLng) / (maxLng - minLng)) * (w - pad * 2);
    const y = pad + ((maxLat - lat) / (maxLat - minLat)) * (h - pad * 2);
    return { x, y };
  }
  const x = pad + ((lng + 180) / 360) * (w - pad * 2);
  const y = pad + ((75 - lat) / 120) * (h - pad * 2);
  return { x, y };
}

function cityOf(name: string, state: string) {
  return findCity(`${name}, ${state}`) ?? findCity(name);
}

export function RouteMap({
  originCity,
  originState,
  destCity,
  destState,
  status,
  currentLocation,
  className,
}: {
  originCity: string;
  originState: string;
  destCity: string;
  destState: string;
  status: ShipmentStatus;
  currentLocation?: string | null;
  className?: string;
}) {
  const w = 640;
  const h = 360;
  const origin = cityOf(originCity, originState) ?? { lat: 34.05, lng: -118.24, name: originCity, state: originState };
  const dest = cityOf(destCity, destState) ?? { lat: 40.71, lng: -74.0, name: destCity, state: destState };
  const o = project(origin.lat, origin.lng, w, h);
  const d = project(dest.lat, dest.lng, w, h);
  const progress = Math.min(1, timelineIndex(status) / 7);
  const cx = o.x + (d.x - o.x) * progress;
  const midX = (o.x + d.x) / 2;
  const midY = Math.min(o.y, d.y) - 48;
  const cy = o.y + (d.y - o.y) * progress + (midY - (o.y + d.y) / 2) * (1 - Math.abs(progress - 0.5) * 2) * 0.35;
  const current = currentLocation
    ? findCity(currentLocation.split(",")[0] ?? "")
    : null;
  const here = current ? project(current.lat, current.lng, w, h) : { x: cx, y: cy };

  return (
    <div className={cn("overflow-hidden rounded-lg bg-navy", className)}>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full" role="img" aria-label="Shipment route map">
        <rect width={w} height={h} className="fill-navy" />
        <g opacity="0.35" stroke="#2a3a55" strokeWidth="1" fill="none">
          {Array.from({ length: 8 }).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={(h / 8) * i} x2={w} y2={(h / 8) * i} />
          ))}
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={`v${i}`} x1={(w / 12) * i} y1="0" x2={(w / 12) * i} y2={h} />
          ))}
        </g>
        <path
          d={`M ${o.x} ${o.y} Q ${midX} ${midY} ${d.x} ${d.y}`}
          fill="none"
          stroke="#3d536e"
          strokeWidth="2"
          strokeDasharray="5 7"
        />
        <path
          d={`M ${o.x} ${o.y} Q ${midX} ${midY} ${d.x} ${d.y}`}
          fill="none"
          stroke="#2a8a9a"
          strokeWidth="2.5"
          pathLength={100}
          strokeDasharray={`${progress * 100} 100`}
        />
        <circle cx={o.x} cy={o.y} r="6" fill="#f3f0e8" />
        <circle cx={d.x} cy={d.y} r="6" fill="#f3f0e8" />
        <circle cx={here.x} cy={here.y} r="8" fill="#2a8a9a" stroke="#f3f0e8" strokeWidth="2" />
        <text x={o.x} y={o.y - 14} textAnchor="middle" fill="#f3f0e8" fontSize="11" fontFamily="Outfit, sans-serif">
          {originCity}
        </text>
        <text x={d.x} y={d.y - 14} textAnchor="middle" fill="#f3f0e8" fontSize="11" fontFamily="Outfit, sans-serif">
          {destCity}
        </text>
      </svg>
    </div>
  );
}

export function FacilitiesMap({
  points,
  className,
}: {
  points: { id: string; name: string; lat: number; lng: number; type: string }[];
  className?: string;
}) {
  const w = 720;
  const h = 400;
  return (
    <div className={cn("overflow-hidden rounded-lg bg-navy", className)}>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full" role="img" aria-label="Facility map">
        <rect width={w} height={h} className="fill-navy" />
        <g opacity="0.3" stroke="#2a3a55" strokeWidth="1">
          {Array.from({ length: 9 }).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={(h / 9) * i} x2={w} y2={(h / 9) * i} />
          ))}
          {Array.from({ length: 14 }).map((_, i) => (
            <line key={`v${i}`} x1={(w / 14) * i} y1="0" x2={(w / 14) * i} y2={h} />
          ))}
        </g>
        {points.map((p) => {
          const { x, y } = project(p.lat, p.lng, w, h);
          const color =
            p.type === "distribution" ? "#2a8a9a" : p.type === "warehouse" ? "#e7e1d3" : "#f3f0e8";
          return (
            <g key={p.id}>
              <circle cx={x} cy={y} r="5" fill={color} />
              <text
                x={x + 8}
                y={y + 4}
                fill="#f3f0e8"
                fontSize="10"
                fontFamily="Outfit, sans-serif"
              >
                {p.name.replace("SwiftShip ", "")}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
