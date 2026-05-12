import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase",
    "migrations",
    "20260512103000_formalize_multishop_fulfillment.sql",
  ),
  "utf8",
);

test("order items carry explicit shop fulfillment ownership", () => {
  assert.match(migration, /add column if not exists shop_id uuid/i);
  assert.match(migration, /order_items_shop_id_fkey/i);
  assert.match(migration, /idx_order_items_shop_status/i);
  assert.match(migration, /product\.shop_id/i);
});

test("order item lifecycle timestamps are managed in the database", () => {
  assert.match(migration, /status_updated_at timestamptz/i);
  assert.match(migration, /confirmed_at timestamptz/i);
  assert.match(migration, /completed_at timestamptz/i);
  assert.match(migration, /cancelled_at timestamptz/i);
  assert.match(migration, /set_order_item_fulfillment_defaults/i);
});

test("order and COD payment status are derived from item statuses", () => {
  assert.match(migration, /sync_order_status_from_items/i);
  assert.match(migration, /COD_PENDING/i);
  assert.match(migration, /COD_COLLECTED/i);
  assert.match(migration, /orders_payment_status_check/i);
});

test("seller order access uses shop-owned order items without recursive orders policy", () => {
  assert.match(migration, /shops\.id = order_items\.shop_id/i);
  assert.match(migration, /shops\.seller_profile_id = auth\.uid\(\)/i);
  assert.doesNotMatch(
    migration,
    /create policy "Sellers can view orders containing own shop products"/i,
  );
});
