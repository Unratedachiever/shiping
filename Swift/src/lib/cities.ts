export type City = {
  name: string;
  state: string;
  country: string;
  postal: string;
  lat: number;
  lng: number;
};

export const CITIES: City[] = [
  { name: "Los Angeles", state: "CA", country: "United States", postal: "90012", lat: 34.0522, lng: -118.2437 },
  { name: "New York", state: "NY", country: "United States", postal: "10001", lat: 40.7128, lng: -74.006 },
  { name: "Chicago", state: "IL", country: "United States", postal: "60601", lat: 41.8781, lng: -87.6298 },
  { name: "Houston", state: "TX", country: "United States", postal: "77002", lat: 29.7604, lng: -95.3698 },
  { name: "Phoenix", state: "AZ", country: "United States", postal: "85004", lat: 33.4484, lng: -112.074 },
  { name: "Dallas", state: "TX", country: "United States", postal: "75201", lat: 32.7767, lng: -96.797 },
  { name: "Miami", state: "FL", country: "United States", postal: "33101", lat: 25.7617, lng: -80.1918 },
  { name: "Seattle", state: "WA", country: "United States", postal: "98101", lat: 47.6062, lng: -122.3321 },
  { name: "Denver", state: "CO", country: "United States", postal: "80202", lat: 39.7392, lng: -104.9903 },
  { name: "Atlanta", state: "GA", country: "United States", postal: "30303", lat: 33.749, lng: -84.388 },
  { name: "Boston", state: "MA", country: "United States", postal: "02108", lat: 42.3601, lng: -71.0589 },
  { name: "San Francisco", state: "CA", country: "United States", postal: "94103", lat: 37.7749, lng: -122.4194 },
  { name: "Philadelphia", state: "PA", country: "United States", postal: "19103", lat: 39.9526, lng: -75.1652 },
  { name: "Detroit", state: "MI", country: "United States", postal: "48226", lat: 42.3314, lng: -83.0458 },
  { name: "Minneapolis", state: "MN", country: "United States", postal: "55401", lat: 44.9778, lng: -93.265 },
  { name: "Portland", state: "OR", country: "United States", postal: "97201", lat: 45.5152, lng: -122.6784 },
  { name: "Las Vegas", state: "NV", country: "United States", postal: "89101", lat: 36.1699, lng: -115.1398 },
  { name: "Charlotte", state: "NC", country: "United States", postal: "28202", lat: 35.2271, lng: -80.8431 },
  { name: "Nashville", state: "TN", country: "United States", postal: "37203", lat: 36.1627, lng: -86.7816 },
  { name: "Austin", state: "TX", country: "United States", postal: "78701", lat: 30.2672, lng: -97.7431 },
  { name: "San Diego", state: "CA", country: "United States", postal: "92101", lat: 32.7157, lng: -117.1611 },
  { name: "St. Louis", state: "MO", country: "United States", postal: "63101", lat: 38.627, lng: -90.1994 },
  { name: "Kansas City", state: "MO", country: "United States", postal: "64105", lat: 39.0997, lng: -94.5786 },
  { name: "Salt Lake City", state: "UT", country: "United States", postal: "84101", lat: 40.7608, lng: -111.891 },
  { name: "New Orleans", state: "LA", country: "United States", postal: "70112", lat: 29.9511, lng: -90.0715 },
  { name: "Washington", state: "DC", country: "United States", postal: "20001", lat: 38.9072, lng: -77.0369 },
  { name: "Memphis", state: "TN", country: "United States", postal: "38103", lat: 35.1495, lng: -90.049 },
  { name: "Columbus", state: "OH", country: "United States", postal: "43215", lat: 39.9612, lng: -82.9988 },
  { name: "Indianapolis", state: "IN", country: "United States", postal: "46204", lat: 39.7684, lng: -86.1581 },
  { name: "Tampa", state: "FL", country: "United States", postal: "33602", lat: 27.9506, lng: -82.4572 },
  { name: "London", state: "England", country: "United Kingdom", postal: "EC1A", lat: 51.5074, lng: -0.1278 },
  { name: "Toronto", state: "ON", country: "Canada", postal: "M5V", lat: 43.6532, lng: -79.3832 },
  { name: "Mexico City", state: "CDMX", country: "Mexico", postal: "06000", lat: 19.4326, lng: -99.1332 },
  { name: "Tokyo", state: "Tokyo", country: "Japan", postal: "100-0001", lat: 35.6762, lng: 139.6503 },
  { name: "Paris", state: "Île-de-France", country: "France", postal: "75001", lat: 48.8566, lng: 2.3522 },
  { name: "Berlin", state: "Berlin", country: "Germany", postal: "10115", lat: 52.52, lng: 13.405 },
  { name: "Sydney", state: "NSW", country: "Australia", postal: "2000", lat: -33.8688, lng: 151.2093 },
  { name: "Singapore", state: "Singapore", country: "Singapore", postal: "018956", lat: 1.3521, lng: 103.8198 },
];

export function cityKey(c: Pick<City, "name" | "state">): string {
  return `${c.name}, ${c.state}`;
}

export function findCity(query: string): City | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;
  return (
    CITIES.find((c) => cityKey(c).toLowerCase() === q) ||
    CITIES.find((c) => c.name.toLowerCase() === q) ||
    CITIES.find((c) => `${c.name}, ${c.state}`.toLowerCase().startsWith(q)) ||
    CITIES.find((c) => c.postal.replace(/\s/g, "") === q.replace(/\s/g, ""))
  );
}

export function cityLabel(c: Pick<City, "name" | "state" | "country">): string {
  if (c.country && c.country !== "United States") return `${c.name}, ${c.country}`;
  return `${c.name}, ${c.state}`;
}

export const SERVICE_CODES = ["standard", "express", "overnight", "international"] as const;
export type ServiceCode = (typeof SERVICE_CODES)[number];

export const SERVICES: Record<
  ServiceCode,
  {
    code: ServiceCode;
    name: string;
    tagline: string;
    description: string;
    daysMin: number;
    daysMax: number;
    base: number;
    perLb: number;
    multiplier: number;
  }
> = {
  standard: {
    code: "standard",
    name: "SwiftShip Ground",
    tagline: "Reliable day-definite delivery",
    description: "Economy ground service across the continental U.S. with full tracking.",
    daysMin: 4,
    daysMax: 7,
    base: 9.85,
    perLb: 0.72,
    multiplier: 1,
  },
  express: {
    code: "express",
    name: "SwiftShip Express",
    tagline: "2–3 business days",
    description: "Priority air and ground for time-sensitive parcels.",
    daysMin: 2,
    daysMax: 3,
    base: 18.4,
    perLb: 1.15,
    multiplier: 1.85,
  },
  overnight: {
    code: "overnight",
    name: "SwiftShip Overnight",
    tagline: "Next-business-day by 10:30 a.m.",
    description: "Overnight air with morning delivery windows in most metros.",
    daysMin: 1,
    daysMax: 1,
    base: 32.5,
    perLb: 1.85,
    multiplier: 3.15,
  },
  international: {
    code: "international",
    name: "SwiftShip Worldwide",
    tagline: "Cross-border with customs support",
    description: "International express to 220+ countries, including brokerage.",
    daysMin: 5,
    daysMax: 10,
    base: 28.9,
    perLb: 2.1,
    multiplier: 2.55,
  },
};

export const PACKAGE_TYPES = [
  { value: "envelope", label: "Envelope" },
  { value: "pak", label: "Pak" },
  { value: "box", label: "Box" },
  { value: "tube", label: "Tube" },
  { value: "crate", label: "Crate / Freight" },
] as const;
