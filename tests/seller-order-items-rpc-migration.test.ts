import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase",
    "migrations",
    "20260511150000_create_seller_order_items_rpc.sql",
  ),
  "utf8",
);

test("seller order item RPC returns only authenticated seller shop items", () => {
  assert.match(migration, /create or replace function public\.get_seller_order_items/i);
  assert.match(migration, /returns table/i);
  assert.match(migration, /from public\.order_items/i);
  assert.match(migration, /join public\.products/i);
  assert.match(migration, /join public\.shops/i);
  assert.match(migration, /join public\.orders/i);
  assert.match(migration, /shops\.seller_profile_id = auth\.uid\(\)/i);
});

test("seller order item RPC exposes the fields needed by the seller order menu", () => {
  assert.match(migration, /product_title text/i);
  assert.match(migration, /buyer_user_id uuid/i);
  assert.match(migration, /payment_method text/i);
  assert.match(migration, /ordered_at timestamptz/i);
  assert.match(migration, /order_total_amount numeric/i);
  assert.match(
    migration,
    /grant execute on function public\.get_seller_order_items\(uuid\) to authenticated/i,
  );
});

test("order statuses are restricted to the four seller menu statuses", () => {
  assert.match(migration, /order_items_status_check/i);
  assert.match(migration, /'PENDING'/i);
  assert.match(migration, /'CONFIRMED'/i);
  assert.match(migration, /'COMPLETED'/i);
  assert.match(migration, /'CANCELLED'/i);
  assert.doesNotMatch(migration, /READY_FOR_PICKUP/i);
});
