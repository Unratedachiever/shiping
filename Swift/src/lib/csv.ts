import type { Shipment } from "./types";
import { formatDate } from "./utils";

function esc(value: string | number | null | undefined): string {
  const s = value == null ? "" : String(value);
  if (/[",\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
  return s;
}

export function shipmentsToCsv(rows: Shipment[]): string {
  const header = [
    "tracking_number",
    "status",
    "service",
    "sender_city",
    "recipient_city",
    "weight_lb",
    "total",
    "payment_status",
    "estimated_delivery",
    "created_at",
    "is_demo",
  ];
  const lines = [header.join(",")];
  for (const s of rows) {
    lines.push(
      [
        esc(s.trackingNumber),
        esc(s.status),
        esc(s.serviceCode),
        esc(s.sender.city),
        esc(s.recipient.city),
        esc(s.package.weightLb),
        esc(s.total),
        esc(s.paymentStatus),
        esc(formatDate(s.estimatedDelivery)),
        esc(formatDate(s.createdAt)),
        esc(s.isDemo ? "yes" : "no"),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
