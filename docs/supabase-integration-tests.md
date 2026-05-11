# Local Supabase Integration Tests

NearbyNow has fast Node tests for pure business rules. The remaining production confidence comes from running SQL-level checks against a local Supabase database.

These tests are prepared in:

```txt
supabase/tests/checkout_rls.test.sql
```

They are intended for local Supabase only. They should not be run against hosted production data.

## What They Cover

- Direct checkout RPC creates an order and decrements stock.
- Cart checkout RPC supports mixed-shop carts.
- Cart checkout RPC rejects out-of-stock products.
- Buyers can only see their own cart items.
- Buyers can only see their own orders.
- Sellers can view and update only their own shop's order item status.
- Sellers cannot update another seller's order item in a multi-shop order.

## How To Run Later

Start Docker Desktop and local Supabase first. After the local database is reset with migrations:

```bash
npx supabase db reset
npx supabase test db
```

Do not run `db reset` against remote Supabase. For hosted Supabase, push migrations only after reviewing them:

```bash
npx supabase db push --dry-run
```

Current note: the remote migration has been pushed, but local SQL tests still require the local Supabase database on `127.0.0.1:54322` to be running.
