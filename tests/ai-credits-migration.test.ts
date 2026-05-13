import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  "supabase/migrations/20260513090000_create_ai_enhancement_credits.sql",
  "utf8",
);

test("ai credit migration creates seller balances, purchases, and enhancement jobs", () => {
  assert.match(migration, /create table if not exists seller_ai_credits/i);
  assert.match(migration, /create table if not exists ai_credit_purchases/i);
  assert.match(migration, /create table if not exists ai_enhancement_jobs/i);
  assert.match(migration, /create table if not exists payment_webhook_events/i);
});

test("ai enhancement credits are reserved atomically and can be refunded", () => {
  assert.match(migration, /create or replace function reserve_ai_enhancement_credit/i);
  assert.match(migration, /and balance >= 1/i);
  assert.match(migration, /balance = balance - 1/i);
  assert.match(migration, /create or replace function refund_ai_enhancement_credit/i);
  assert.match(migration, /balance = balance \+ v_cost_credits/i);
});

test("paid purchases grant credits only once", () => {
  assert.match(
    migration,
    /create or replace function grant_ai_credits_for_paid_purchase/i,
  );
  assert.match(migration, /if v_purchase.status = 'paid' then/i);
  assert.match(migration, /on conflict \(seller_profile_id\) do update/i);
  assert.match(migration, /lifetime_purchased/i);
});

test("ai credit tables use owner-scoped read policies", () => {
  assert.match(migration, /seller_profile_id = auth\.uid\(\)/i);
  assert.match(migration, /Sellers can view own AI credit balance/i);
  assert.match(migration, /Sellers can view own AI credit purchases/i);
  assert.match(migration, /Sellers can view own AI enhancement jobs/i);
});
