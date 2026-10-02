-- Ops upgrade: audit log, delivery prefs, inbox status, shipment notes / hold

alter table shipments add column if not exists internal_notes text;
alter table shipments add column if not exists hold_location_id text;
alter table shipments add column if not exists exception_reason text;

alter table contact_messages add column if not exists status text not null default 'open';
alter table contact_messages add column if not exists staff_notes text;
alter table contact_messages add column if not exists resolved_at timestamptz;

create table if not exists admin_activity_log (
  id text primary key,
  actor_user_id text not null,
  action text not null,
  entity_type text not null,
  entity_id text,
  summary text not null,
  meta_json text,
  created_at timestamptz not null default now()
);
create index if not exists admin_activity_log_created_idx on admin_activity_log (created_at desc);
create index if not exists admin_activity_log_entity_idx on admin_activity_log (entity_type, entity_id);

create table if not exists delivery_preferences (
  user_id text primary key,
  signature_required boolean not null default false,
  leave_at_door boolean not null default true,
  hold_at_location boolean not null default false,
  preferred_location_id text,
  delivery_instructions text,
  notify_email boolean not null default true,
  notify_sms boolean not null default false,
  updated_at timestamptz not null default now()
);
