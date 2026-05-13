import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { join } from "node:path";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase",
    "migrations",
    "20260513143000_add_shop_pickup_locations.sql",
  ),
  "utf8",
);

test("pickup locations are stored outside public shops table", () => {
  assert.match(
    migration,
    /create table if not exists public\.shop_pickup_locations/i,
  );
  assert.match(migration, /shop_id uuid primary key/i);
  assert.match(migration, /latitude numeric\(9, 6\) not null/i);
  assert.match(migration, /longitude numeric\(9, 6\) not null/i);
});

test("pickup location RLS is seller-owned", () => {
  assert.match(migration, /alter table public\.shop_pickup_locations enable row level security/i);
  assert.match(migration, /Sellers can view own pickup location/i);
  assert.match(migration, /shops\.seller_profile_id = auth\.uid\(\)/i);
  assert.doesNotMatch(migration, /Anyone can view .*pickup/i);
});

test("buyer order RPC exposes pickup details only after confirmation", () => {
  assert.match(migration, /create function public\.get_buyer_order_items\(\)/i);
  assert.match(migration, /when order_items\.status in \('CONFIRMED', 'COMPLETED'\)/i);
  assert.match(migration, /pickup\.address/i);
});

test("seller order RPC includes own shop pickup details", () => {
  assert.match(migration, /create function public\.get_seller_order_items/i);
  assert.match(migration, /left join public\.shop_pickup_locations pickup/i);
  assert.match(migration, /where order_items\.shop_id = p_shop_id/i);
  assert.match(migration, /and shops\.seller_profile_id = auth\.uid\(\)/i);
});
