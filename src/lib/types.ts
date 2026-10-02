import type { ServiceCode } from "./cities";
import type { ShipmentStatus } from "./status";

export type AddressInput = {
  fullName: string;
  phone: string;
  email: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type PackageInput = {
  packageType: string;
  weightLb: number;
  lengthIn: number;
  widthIn: number;
  heightIn: number;
  description: string;
  declaredValue: number;
};

export type TrackingEvent = {
  id: string;
  status: ShipmentStatus;
  location: string;
  description: string;
  occurredAt: string;
};

export type Shipment = {
  id: string;
  trackingNumber: string;
  userId: string | null;
  status: ShipmentStatus;
  serviceCode: ServiceCode | string;
  sender: AddressInput;
  recipient: AddressInput;
  package: PackageInput;
  currentLocation: string | null;
  estimatedDelivery: string | null;
  subtotal: number;
  tax: number;
  fees: number;
  total: number;
  paymentStatus: string;
  paymentMethod: string | null;
  isDemo: boolean;
  lastUpdated: string;
  createdAt: string;
  events: TrackingEvent[];
  internalNotes?: string | null;
  holdLocationId?: string | null;
  exceptionReason?: string | null;
};

export type Facility = {
  id: string;
  name: string;
  type: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  lat: number;
  lng: number;
  phone: string | null;
  hours: string | null;
  services: string | null;
};

export type SavedAddress = AddressInput & {
  id: string;
  label: string;
  isDefault: boolean;
};

export type AppNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  shipmentId: string | null;
  createdAt: string;
};

export type BillingMethod = {
  id: string;
  brand: string;
  last4: string;
  expMonth: number | null;
  expYear: number | null;
  isDefault: boolean;
};

export type Profile = {
  userId: string;
  role: "customer" | "admin";
  fullName: string | null;
  phone: string | null;
  company: string | null;
  email: string | null;
};

export type AdminStats = {
  total: number;
  today: number;
  inTransit: number;
  delivered: number;
  delayed: number;
  pending: number;
  outForDelivery: number;
  exceptions: number;
  unpaid: number;
  revenue: number;
  customers: number;
  messages: number;
  openMessages: number;
  activity: { day: string; count: number; revenue: number }[];
  recent: Shipment[];
  attention: Shipment[];
};

export type AdminPayment = {
  id: string;
  shipmentId: string;
  trackingNumber: string;
  method: string;
  status: string;
  provider: string;
  last4: string | null;
  total: number;
  createdAt: string;
  senderName: string;
  recipientName: string;
};

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  createdAt: string;
  status?: string;
  staffNotes?: string | null;
  resolvedAt?: string | null;
};

export type DeliveryPreferences = {
  signatureRequired: boolean;
  leaveAtDoor: boolean;
  holdAtLocation: boolean;
  preferredLocationId: string | null;
  deliveryInstructions: string;
  notifyEmail: boolean;
  notifySms: boolean;
};

export type AdminActivity = {
  id: string;
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string | null;
  summary: string;
  metaJson: string | null;
  createdAt: string;
};

export type AdminCustomerDetail = {
  profile: {
    userId: string;
    role: string;
    fullName: string | null;
    phone: string | null;
    company: string | null;
    createdAt: string;
  };
  shipments: Shipment[];
  addresses: SavedAddress[];
  paymentsTotal: number;
};
