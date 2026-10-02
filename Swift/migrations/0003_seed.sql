-- Catalog. Safe to re-run: inserts are guarded.

insert into shipping_services (id, code, name, description, speed_days_min, speed_days_max, base_rate, per_lb_rate, multiplier)
select * from (values
  ('svc_ground', 'standard', 'SwiftShip Ground', 'Reliable day-definite delivery across the continental U.S.', 4, 7, 9.85, 0.72, 1.00),
  ('svc_express', 'express', 'SwiftShip Express', 'Priority 2–3 business day service.', 2, 3, 18.40, 1.15, 1.85),
  ('svc_overnight', 'overnight', 'SwiftShip Overnight', 'Next-business-day morning delivery.', 1, 1, 32.50, 1.85, 3.15),
  ('svc_world', 'international', 'SwiftShip Worldwide', 'Cross-border express with customs brokerage.', 5, 10, 28.90, 2.10, 2.55)
) as v(id, code, name, description, speed_days_min, speed_days_max, base_rate, per_lb_rate, multiplier)
where not exists (select 1 from shipping_services s where s.id = v.id);

insert into facility_locations (id, name, type, street, city, state, postal_code, country, lat, lng, phone, hours, services)
select * from (values
  ('loc_la_hub', 'Los Angeles Gateway Hub', 'distribution', '4100 E Bandini Blvd', 'Los Angeles', 'CA', '90040', 'United States', 34.005, -118.16, '1-800-794-3844', 'Open 24 hours', 'Drop-off, pickup, freight, holds'),
  ('loc_la_sc', 'Downtown LA Service Center', 'service', '888 S Figueroa St', 'Los Angeles', 'CA', '90017', 'United States', 34.047, -118.261, '1-800-794-3844', 'Mon–Fri 8:00–19:00, Sat 9:00–14:00', 'Packaging, drop-off, prints'),
  ('loc_ny_hub', 'New York Metro Hub', 'distribution', '1200 Randolph Ave', 'New York', 'NY', '07114', 'United States', 40.73, -74.15, '1-800-794-3844', 'Open 24 hours', 'Drop-off, pickup, freight'),
  ('loc_ny_pk', 'Manhattan Pickup Point', 'pickup', '350 5th Ave, Suite 210', 'New York', 'NY', '10118', 'United States', 40.7484, -73.9857, '1-800-794-3844', 'Mon–Fri 7:30–20:00, Sat 9:00–16:00', 'Drop-off, holds, packing'),
  ('loc_chi_hub', 'Chicago Sortation Center', 'warehouse', '7100 S Cicero Ave', 'Chicago', 'IL', '60638', 'United States', 41.764, -87.743, '1-800-794-3844', 'Open 24 hours', 'Freight, drop-off'),
  ('loc_dal_hub', 'Dallas Inland Hub', 'distribution', '2400 Valley View Ln', 'Dallas', 'TX', '75234', 'United States', 32.93, -96.89, '1-800-794-3844', 'Open 24 hours', 'Drop-off, freight, customs'),
  ('loc_phx', 'Phoenix Desert Gateway', 'warehouse', '3800 E Washington St', 'Phoenix', 'AZ', '85034', 'United States', 33.448, -112.0, '1-800-794-3844', 'Mon–Sun 6:00–22:00', 'Drop-off, pickup'),
  ('loc_mia', 'Miami International Gateway', 'distribution', '1800 NW 89th Ave', 'Miami', 'FL', '33172', 'United States', 25.79, -80.33, '1-800-794-3844', 'Open 24 hours', 'International, customs, freight'),
  ('loc_sea', 'Seattle Cascade Hub', 'warehouse', '640 S 96th St', 'Seattle', 'WA', '98108', 'United States', 47.52, -122.33, '1-800-794-3844', 'Mon–Sat 6:00–21:00', 'Drop-off, pickup'),
  ('loc_atl', 'Atlanta Peachtree Hub', 'distribution', '2200 Sullivan Rd', 'Atlanta', 'GA', '30337', 'United States', 33.66, -84.43, '1-800-794-3844', 'Open 24 hours', 'Drop-off, freight'),
  ('loc_den', 'Denver High Plains Center', 'warehouse', '4900 Smith Rd', 'Denver', 'CO', '80216', 'United States', 39.78, -104.96, '1-800-794-3844', 'Mon–Sat 7:00–20:00', 'Drop-off, pickup'),
  ('loc_bos', 'Boston Harbor Service Center', 'service', '1 Seaport Blvd', 'Boston', 'MA', '02210', 'United States', 42.35, -71.04, '1-800-794-3844', 'Mon–Fri 8:00–18:30', 'Packaging, drop-off'),
  ('loc_sf', 'San Francisco Bay Drop-off', 'pickup', '301 Mission St', 'San Francisco', 'CA', '94105', 'United States', 37.790, -122.396, '1-800-794-3844', 'Mon–Fri 8:00–19:00, Sat 10:00–15:00', 'Drop-off, holds'),
  ('loc_mem', 'Memphis Super Hub', 'distribution', '3875 Airways Blvd', 'Memphis', 'TN', '38116', 'United States', 35.05, -89.98, '1-800-794-3844', 'Open 24 hours', 'National sort, freight'),
  ('loc_lon', 'London Heathrow Gateway', 'distribution', 'Unit 4, Polar Park', 'London', 'England', 'TW6', 'United Kingdom', 51.47, -0.45, '+44 20 7946 0100', 'Open 24 hours', 'International, customs'),
  ('loc_tor', 'Toronto Pearson Center', 'warehouse', '6300 Silver Dart Dr', 'Toronto', 'ON', 'L5P', 'Canada', 43.68, -79.63, '1-800-794-3844', 'Mon–Sun 6:00–23:00', 'Cross-border, drop-off')
) as v(id, name, type, street, city, state, postal_code, country, lat, lng, phone, hours, services)
where not exists (select 1 from facility_locations f where f.id = v.id);
