# Changelog

## 1.1.0 — Professional product upgrade (2026-09-09)

### Visual / UX
- Tightened design tokens, focus rings, data-table styles, empty states, elevated card shadows.
- Print stylesheet for packing slips / tracking print view.
- Class-based dark mode toggle in the header (brand-safe navy/teal palette).
- Tracking page: shareable link, copy link, print, DEMO banner, packing slip sheet.
- Quote comparison: selectable service cards with ETA + price breakdown (subtotal / tax / fees).
- Returns page expanded with steps + FAQ.
- Homepage hero CTAs for ship + quote.

### Customer
- Shipment history search/filter + **CSV export**.
- Account shipment detail: packing slip / print label actions + breadcrumbs.
- Saved addresses: edit, delete, set default.
- Notifications: mark read + **mark all read**, link to shipment.
- **Delivery preferences** stub (signature, leave-at-door, hold-at-location tied to facilities).

### Admin
- Dashboard KPIs: shipments **today**, in-transit, exceptions/delayed, revenue, open inbox.
- Clearly labeled **Seed DEMO shipments** action (sample in-transit + events).
- Shipment detail: status advance wizard, exception reason, ETA edit, internal notes, scan events.
- Shipments table: multi-select **bulk status update**.
- Customer list deep-link → customer detail (shipments + addresses).
- Inbox: in-progress / resolve / staff notes.
- **Activity log** of admin status changes, bulk updates, inbox, and demo seeds.

### Platform
- Additive migration `0005_ops_upgrade.sql` (audit log, delivery prefs, inbox status, shipment notes).
- `README.md`, `CHANGELOG.md`, `.env.example`.
- Routes: `/account/preferences`, `/admin/activity`, `/admin/customers/$userId`.

### Honesty
- DEMO flags surfaced in UI; no third-party carrier branding or live PAN storage.
