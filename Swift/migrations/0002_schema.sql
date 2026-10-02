-- SwiftShip Logistics schema

create table if not exists profiles (
  user_id text primary key,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  full_name text,
  phone text,
  company text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists saved_addresses (
  id text primary key,
  user_id text not null,
  label text not null default 'Address',
  full_name text not null,
  phone text,
  email text,
  street text not null,
  city text not null,
  state text not null,
  postal_code text not null,
  country text not null default 'United States',
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists saved_addresses_user_idx on saved_addresses (user_id);

create table if not exists shipping_services (
  id text primary key,
  code text not null unique,
  name text not null,
  description text not null,
  speed_days_min int not null,
  speed_days_max int not null,
  base_rate numeric not null,
  per_lb_rate numeric not null,
  multiplier numeric not null default 1,
  active boolean not null default true
);

create table if not exists shipments (
  id text primary key,
  tracking_number text not null unique,
  user_id text,
  status text not null,
  service_code text not null,
  sender_name text not null,
  sender_phone text,
  sender_email text,
  sender_street text not null,
  sender_city text not null,
  sender_state text not null,
  sender_postal text not null,
  sender_country text not null,
  recipient_name text not null,
  recipient_phone text,
  recipient_email text,
  recipient_street text not null,
  recipient_city text not null,
  recipient_state text not null,
  recipient_postal text not null,
  recipient_country text not null,
  package_type text not null default 'box',
  weight_lb numeric not null,
  length_in numeric,
  width_in numeric,
  height_in numeric,
  description text,
  declared_value numeric,
  current_location text,
  estimated_delivery date,
  subtotal numeric not null default 0,
  tax numeric not null default 0,
  fees numeric not null default 0,
  total numeric not null default 0,
  payment_status text not null default 'pending',
  payment_method text,
  is_demo boolean not null default false,
  last_updated timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists shipments_tracking_idx on shipments (tracking_number);
create index if not exists shipments_user_idx on shipments (user_id);
create index if not exists shipments_status_idx on shipments (status);

create table if not exists tracking_events (
  id text primary key,
  shipment_id text not null references shipments(id) on delete cascade,
  status text not null,
  location text not null,
  description text not null,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists tracking_events_shipment_idx on tracking_events (shipment_id, occurred_at);

create table if not exists payments (
  id text primary key,
  shipment_id text not null references shipments(id) on delete cascade,
  user_id text,
  amount numeric not null,
  tax numeric not null,
  fees numeric not null,
  total numeric not null,
  method text not null,
  status text not null,
  provider text not null default 'demo',
  provider_ref text,
  last4 text,
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id text primary key,
  user_id text not null,
  shipment_id text,
  type text not null,
  title text not null,
  body text not null,
  read boolean not null default false,
  channel text not null default 'in_app',
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on notifications (user_id, created_at desc);

create table if not exists facility_locations (
  id text primary key,
  name text not null,
  type text not null,
  street text not null,
  city text not null,
  state text not null,
  postal_code text not null,
  country text not null,
  lat numeric not null,
  lng numeric not null,
  phone text,
  hours text,
  services text
);
create index if not exists facility_locations_city_idx on facility_locations (lower(city));
create index if not exists facility_locations_postal_idx on facility_locations (postal_code);

create table if not exists contact_messages (
  id text primary key,
  name text not null,
  email text not null,
  topic text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists billing_methods (
  id text primary key,
  user_id text not null,
  brand text not null,
  last4 text not null,
  exp_month int,
  exp_year int,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists billing_methods_user_idx on billing_methods (user_id);
