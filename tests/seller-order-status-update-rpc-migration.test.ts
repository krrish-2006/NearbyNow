import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase",
    "migrations",
    "20260511154000_create_seller_order_status_update_rpc.sql",
  ),
  "utf8",
);

test("seller status update RPC owns the complete status update path", () => {
  assert.match(
    migration,
    /create or replace function public\.update_seller_order_item_status/i,
  );
  assert.match(migration, /security definer/i);
  assert.match(migration, /update public\.order_items/i);
  assert.match(migration, /set status = p_status/i);
  assert.match(migration, /products\.id = order_items\.product_id/i);
  assert.match(migration, /shops\.seller_profile_id = auth\.uid\(\)/i);
  assert.match(migration, /return v_updated_count = 1/i);
});

test("seller status update RPC only accepts the four seller statuses", () => {
  assert.match(migration, /'PENDING'/i);
  assert.match(migration, /'CONFIRMED'/i);
  assert.match(migration, /'COMPLETED'/i);
  assert.match(migration, /'CANCELLED'/i);
  assert.doesNotMatch(migration, /READY_FOR_PICKUP/i);
});

test("seller status update RPC is executable by authenticated users", () => {
  assert.match(
    migration,
    /grant execute on function public\.update_seller_order_item_status\(uuid, text\) to authenticated/i,
  );
});
