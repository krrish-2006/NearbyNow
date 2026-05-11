import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase",
    "migrations",
    "20260511095439_atomic_checkout_rpc.sql",
  ),
  "utf8",
);

test("direct checkout RPC creates order, creates item, locks stock, and decrements stock", () => {
  const directRpc = section("place_direct_cod_order", "place_cart_cod_order");

  assert.match(directRpc, /for update/i);
  assert.match(directRpc, /insert into public\.orders/i);
  assert.match(directRpc, /insert into public\.order_items/i);
  assert.match(directRpc, /v_product\.stock_quantity < p_quantity/i);
  assert.match(directRpc, /set stock_quantity = stock_quantity - p_quantity/i);
});

test("cart checkout RPC validates stock, creates order items, decrements stock, and clears cart", () => {
  const cartRpc = section("place_cart_cod_order", "revoke all");

  assert.match(cartRpc, /for update/i);
  assert.match(cartRpc, /insert into public\.orders/i);
  assert.match(cartRpc, /insert into public\.order_items/i);
  assert.match(cartRpc, /product\.stock_quantity < cart_item\.quantity/i);
  assert.match(cartRpc, /set stock_quantity = product\.stock_quantity - cart_item\.quantity/i);
  assert.match(cartRpc, /delete from public\.cart_items/i);
});

test("checkout RPCs are executable only by authenticated users", () => {
  assert.match(
    migration,
    /grant execute on function public\.place_direct_cod_order\(uuid, integer\) to authenticated/i,
  );
  assert.match(
    migration,
    /grant execute on function public\.place_cart_cod_order\(\) to authenticated/i,
  );
});

test("cart items have owner-scoped RLS policies", () => {
  assert.match(migration, /alter table public\.cart_items enable row level security/i);
  assert.match(migration, /create policy "Users can view own cart items"/i);
  assert.match(migration, /create policy "Users can insert own cart items"/i);
  assert.match(migration, /create policy "Users can update own cart items"/i);
  assert.match(migration, /create policy "Users can delete own cart items"/i);
  assert.match(migration, /using \(auth\.uid\(\) = user_id\)/i);
});

test("seller order item status updates are item-scoped", () => {
  assert.match(migration, /add column if not exists status text not null default 'PENDING'/i);
  assert.match(migration, /create or replace function public\.seller_can_update_order_item_status/i);
  assert.match(migration, /order_items\.id = p_order_item_id/i);
  assert.match(
    migration,
    /using \(public\.seller_can_update_order_item_status\(order_items\.id\)\)/i,
  );
  assert.match(
    migration,
    /with check \(public\.seller_can_update_order_item_status\(order_items\.id\)\)/i,
  );
});

function section(startPattern: string, endPattern: string): string {
  const start = migration.indexOf(startPattern);
  const end = migration.indexOf(endPattern, start + startPattern.length);

  assert.notEqual(start, -1);
  assert.notEqual(end, -1);

  return migration.slice(start, end);
}
