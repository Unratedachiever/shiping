import { Badge } from "@/components/ui/badge";
import { STATUS_META, isShipmentStatus, type ShipmentStatus } from "@/lib/status";

export function StatusBadge({ status }: { status: string }) {
  const key: ShipmentStatus = isShipmentStatus(status) ? status : "in_transit";
  const meta = STATUS_META[key];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}
