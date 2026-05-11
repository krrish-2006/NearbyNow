import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase",
    "migrations",
    "20260511152000_fix_order_items_update_rls_recursion.sql",
  ),
  "utf8",
);

test("seller order item update policy avoids recursive order_items policy calls", () => {
  assert.match(
    migration,
    /drop policy if exists "Sellers can update own shop order item status"/i,
  );
  assert.match(migration, /create policy "Sellers can update own shop order item status"/i);
  assert.match(migration, /for update/i);
  assert.match(migration, /from public\.products/i);
  assert.match(migration, /join public\.shops/i);
  assert.match(migration, /products\.id = order_items\.product_id/i);
  assert.match(migration, /shops\.seller_profile_id = auth\.uid\(\)/i);
  assert.doesNotMatch(
    migration,
    /seller_can_update_order_item_status\(order_items\.id\)/i,
  );
});
