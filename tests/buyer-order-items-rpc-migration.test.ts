import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase",
    "migrations",
    "20260511155500_create_buyer_order_items_rpc.sql",
  ),
  "utf8",
);

test("buyer order item RPC returns only current buyer orders", () => {
  assert.match(migration, /create or replace function public\.get_buyer_order_items/i);
  assert.match(migration, /returns table/i);
  assert.match(migration, /from public\.orders/i);
  assert.match(migration, /join public\.order_items/i);
  assert.match(migration, /join public\.products/i);
  assert.match(migration, /where orders\.user_id = auth\.uid\(\)/i);
});

test("buyer order item RPC exposes order and item status fields", () => {
  assert.match(migration, /orders\.status as order_status/i);
  assert.match(migration, /order_items\.status as item_status/i);
  assert.match(migration, /products\.title as product_title/i);
  assert.match(
    migration,
    /grant execute on function public\.get_buyer_order_items\(\) to authenticated/i,
  );
});
