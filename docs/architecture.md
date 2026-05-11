# Architecture

## Overview

NearbyNow uses a feature-oriented Next.js App Router architecture with shared repository and service layers.

## Main Folders

- `src/app`: route-level pages, layouts, route handlers, and app shell.
- `src/components`: shared UI and layout components.
- `src/features`: domain-specific UI, actions, schemas, types, and helpers.
- `src/repositories`: reusable Supabase query helpers.
- `src/services`: business logic that coordinates repositories and domain rules.
- `src/lib`: infrastructure helpers such as Supabase clients, storage, and formatters.
- `src/types`: generated/shared database types.
- `supabase/migrations`: database schema migrations.

## Current Pattern

Route pages should stay thin:

1. Create a Supabase server client.
2. Read auth/session if needed.
3. Call repository helpers for data.
4. Render feature components.

Repositories should own Supabase query details:

- selected columns
- joins
- filtering
- ordering
- mapping to typed read models

Feature components should receive typed props and avoid querying data directly.

Server Actions should handle mutations:

- validate user/auth
- validate input
- call service/repository logic
- revalidate affected paths
- redirect or return an action result

## Current Strong Areas

- Buyer product, cart, and order pages use typed repository helpers.
- Seller product/settings/order pages use typed repository helpers.
- Product card receives a typed `ProductCardProduct`.
- Product, cart, and order read models exist under feature folders.
- Seller read models exist under `src/features/seller/types`.
- Supabase server/client setup is centralized.
- Product create/update/delete uses a service layer.
- Cart/direct checkout order creation and stock decrement happen inside Postgres RPCs.
- The app uses `src/proxy.ts` for Next.js 16 request interception.
- A native Node test suite covers core checkout/cart/order-status business rules.
- `ActionResult` exists as a shared action return type.
- `src/types/database.ts` is the single database type source.
- Cart checkout supports multi-shop orders through item-level fulfillment status.
- Checkout forms display structured action errors.
- Local Supabase integration-test preparation exists for RPC and RLS verification.
- Seller navigation is focused on Profile, Orders, and Products.
- Seller Profile owns shop city updates through a dedicated Server Action and repository helper.
- Wishlist/favorites use a migration, repository helpers, Server Action, and product-detail toggle UI.
- Seller Orders uses repository-backed metrics for cart quantity, wishlisted products, and completed orders.
- Product create/edit uses shared schema validation for the 50-word description limit and maximum selected images.

## Current Weak Areas

- Tests are still unit/static checks; RLS and checkout need local Supabase integration tests.
- Prepared local Supabase integration tests still need to be run against a reset local database.
- The seller cart quantity RPC migration is prepared but still needs to be pushed to the linked Supabase database.
- Seller fulfillment is item-scoped; richer operational states like pickup windows or cancellation reasons are not modeled yet.
- Product storage currently saves one primary image URL even though the UI can select up to five files.
- Repository return shapes and error handling are not fully standardized.

## Preferred Style Going Forward

- Prefer typed repositories over raw Supabase queries in pages.
- Prefer service functions for business rules.
- Prefer `ActionResult` style returns for Server Actions.
- Avoid `any`.
- Keep migrations timestamped with `YYYYMMDDHHMMSS`.
- Keep pages readable and boring.
