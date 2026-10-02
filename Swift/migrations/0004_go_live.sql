-- Drop sample shipments so the live site only tracks real bookings.

delete from notifications
where shipment_id in (select id from shipments where is_demo = true);

delete from shipments where is_demo = true;

alter table payments alter column provider set default 'processor';

update payments set provider = 'processor' where provider = 'demo';
