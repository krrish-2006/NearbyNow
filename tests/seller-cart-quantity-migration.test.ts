import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase",
    "migrations",
    "20260511143000_create_seller_cart_quantity_rpc.sql",
  ),
  "utf8",
);

test("seller cart quantity metric is exposed through a seller-owned shop RPC", () => {
  assert.match(migration, /create or replace function public\.get_shop_cart_quantity/i);
  assert.match(migration, /sum\(cart_items\.quantity\)/i);
  assert.match(migration, /shops\.seller_profile_id = auth\.uid\(\)/i);
  assert.match(
    migration,
    /grant execute on function public\.get_shop_cart_quantity\(uuid\) to authenticated/i,
  );
});
