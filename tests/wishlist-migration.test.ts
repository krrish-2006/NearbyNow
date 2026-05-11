import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase",
    "migrations",
    "20260511121617_create_wishlist_system.sql",
  ),
  "utf8",
);

test("wishlist migration creates buyer-product unique wishlist rows", () => {
  assert.match(migration, /create table if not exists public\.wishlists/i);
  assert.match(migration, /user_id uuid not null references auth\.users/i);
  assert.match(migration, /product_id uuid not null references public\.products/i);
  assert.match(
    migration,
    /constraint unique_wishlist_per_user_product unique \(user_id, product_id\)/i,
  );
});

test("wishlist migration protects rows with owner-scoped RLS", () => {
  assert.match(migration, /alter table public\.wishlists enable row level security/i);
  assert.match(migration, /create policy "Users can view own wishlist items"/i);
  assert.match(migration, /create policy "Users can insert own wishlist items"/i);
  assert.match(migration, /create policy "Users can delete own wishlist items"/i);
  assert.match(migration, /using \(auth\.uid\(\) = user_id\)/i);
  assert.match(migration, /with check \(auth\.uid\(\) = user_id\)/i);
});

test("wishlist seller metric is exposed through a seller-owned shop RPC", () => {
  assert.match(migration, /create or replace function public\.get_shop_wishlist_count/i);
  assert.match(migration, /shops\.seller_profile_id = auth\.uid\(\)/i);
  assert.match(
    migration,
    /grant execute on function public\.get_shop_wishlist_count\(uuid\) to authenticated/i,
  );
});
