# NearbyNow Project Context

## What This Project Is

NearbyNow is a local marketplace app for discovering and buying products from nearby shops. The current MVP is focused on Durgapur, with other cities shown as coming soon.

The app has two main modes:

- Buyer: browse products, search/filter, view product details, add to cart, buy now, place COD orders, view orders.
- Seller: become a seller, manage shop/profile city, add/edit/delete products, view seller orders, and track seller order/wishlist metrics.

## Tech Stack

- Next.js App Router with React and TypeScript
- Supabase for auth, PostgreSQL database, RLS, and product image storage
- Tailwind CSS for styling
- Server Actions for mutations
- Zod and React Hook Form for product form validation
- Vercel-style deployment target

## Important Commands

```bash
npm run dev
npm run build
npm run test
npm run test:e2e
npx tsc --noEmit
npm run lint
npx supabase migration list
npx supabase db push
```

Note: on Windows, `npm run build` may need permission outside sandbox because Next.js worker spawning can fail with `spawn EPERM`.

## Current Architecture

The app uses feature folders plus shared repositories:

- `src/app`: Next.js routes and pages
- `src/features/products`: product UI, schemas, actions, product-specific types
- `src/features/cart`: cart UI/actions/types
- `src/features/orders`: order actions/types
- `src/features/checkout`: direct checkout flow and pricing helper
- `src/features/seller`: seller utilities and components
- `src/repositories`: reusable Supabase read/write helpers
- `src/services`: business/service layer, currently strongest around product creation/update/delete
- `src/lib/supabase`: Supabase client/server setup
- `src/lib/storage`: Supabase Storage helpers
- `src/lib/formatters`: shared formatting helpers

Recent architecture improvement:

- Buyer product/cart/order pages now use typed repository helpers instead of hand-writing Supabase queries in each page.
- Product, cart, and order read models were added under feature type folders.
- Product-card and product pages no longer depend on `any`.
- Product image storage now imports the current `Database` type from `src/types/database`.
- Seller product/settings/order pages now use typed repository helpers and shared seller read models.
- Cart/direct checkout now call atomic Postgres RPCs for order creation and stock decrement.
- Next.js request interception uses `src/proxy.ts` instead of the deprecated `src/middleware.ts` convention.
- TypeScript, ESLint, and production build pass locally.
- Native Node tests cover checkout pricing, cart quantity rules, checkout RPC migration behavior, checkout error mapping, and seller order status authorization helpers.
- `src/types/database.ts` is the single database type source; the older duplicate `database.types.ts` file was removed.
- Cart checkout supports multi-shop carts by using item-level fulfillment status on `order_items`.
- Checkout errors are surfaced in the cart/direct checkout forms instead of silently redirecting whenever possible.
- Local Supabase integration-test preparation lives in `supabase/tests/checkout_rls.test.sql` and `docs/supabase-integration-tests.md`.
- Seller navigation is now Profile, Orders, Products. The old Dashboard entry is gone, and `/seller/settings` redirects to `/seller/profile`.
- Seller Profile owns shop city updates through a typed Server Action and repository helper.
- Product create/edit uses a cleaner image picker, enforces a 50-word description limit, and supports replacing the primary image during edit.
- Wishlist/favorites support has been added with buyer toggle UI, RLS migration, repository helpers, and seller wishlist metrics.
- Seller Orders shows real metrics for cart quantity, wishlisted products, and completed orders.
- Local Supabase SQL integration tests have been run successfully against a Docker-backed local database.
- Multi-shop fulfillment is now explicit: each `order_items` row stores its owning `shop_id`, item lifecycle timestamps, and item status.
- Order status and COD payment status are derived in Postgres from the current item statuses.
- Vercel Analytics, Speed Insights, structured server logs, and an app error boundary are in place.
- Playwright browser E2E smoke tests cover the marketplace shell and protected route redirects.

## Key Files

- Home marketplace: `src/app/page.tsx`
- Products listing: `src/app/products/page.tsx`
- Product detail: `src/app/products/[id]/page.tsx`
- Product card: `src/features/products/components/product-card.tsx`
- Cart page: `src/app/cart/page.tsx`
- Orders page: `src/app/orders/page.tsx`
- Navbar: `src/components/layout/navbar.tsx`
- Product repository: `src/repositories/product.repository.ts`
- Cart repository: `src/repositories/cart.repository.ts`
- Order repository: `src/repositories/order.repository.ts`
- Wishlist repository: `src/repositories/wishlist.repository.ts`
- Category repository: `src/repositories/category.repository.ts`
- City repository: `src/repositories/city.repository.ts`
- Product types: `src/features/products/types/product.types.ts`
- Cart types: `src/features/cart/types/cart.types.ts`
- Order types: `src/features/orders/types/order.types.ts`

## Database Notes

Important tables:

- `profiles`
- `cities`
- `categories`
- `shops`
- `products`
- `cart_items`
- `orders`
- `order_items`
- `wishlists`
- `shop_pickup_locations`

Important relationships:

- A seller profile owns one shop.
- A shop owns many products.
- Products belong to categories.
- Users own cart items.
- Users own orders.
- Orders have order items.
- Order items have an owning shop for seller-scoped fulfillment.
- Users own wishlist rows, and each buyer can wishlist a product only once.
- A shop can have one protected pickup location used for confirmed pickup orders.

Important RLS/policy note:

- Products are public-readable.
- Shops need public select access so buyer pages can show shop names.
- A migration was added for this: `20260511080728_allow_public_shop_select.sql`.
- Atomic checkout RPCs and seller order RLS were added in `20260511095439_atomic_checkout_rpc.sql`.
- Cart item table/RLS hardening and seller single-shop order-status protection also live in `20260511095439_atomic_checkout_rpc.sql`.
- `20260511095439_atomic_checkout_rpc.sql` has been pushed to the linked remote Supabase project.
- Wishlist table/RLS and the seller-owned wishlist metric RPC were added in `20260511121617_create_wishlist_system.sql`.
- `20260511121617_create_wishlist_system.sql` has been pushed to the linked remote Supabase project.
- Seller cart quantity metric RPC was added in `20260511143000_create_seller_cart_quantity_rpc.sql`.
- Seller order item RPC, status update RPC, buyer order item RPC, and RLS recursion fixes have been pushed.
- Multi-shop fulfillment and order/payment lifecycle hardening live in `20260512103000_formalize_multishop_fulfillment.sql`.
- Pickup locations live in `shop_pickup_locations`, not public `shops`, so precise pickup addresses are only shown to sellers and buyers with confirmed/completed order items.

Migration hygiene:

- Supabase migration files must use 14-digit timestamp versions like `YYYYMMDDHHMMSS_name.sql`.
- Older short migration names were renamed:
  - `20260509165740_create_orders.sql`
  - `20260510095056_phase5_checkout_foundation.sql`
  - `20260511080728_allow_public_shop_select.sql`

## Current Product/Stock Behavior

- Product cards show `In stock: X`.
- Product detail page shows `In stock: X` below price.
- Direct Buy Now decrements stock by purchased quantity through an atomic Postgres RPC.
- Cart checkout decrements stock for cart quantities through an atomic Postgres RPC.
- Cart checkout can include products from multiple shops. Each order item starts as `PENDING`.
- Each order item stores the seller shop that fulfills it.
- Seller status changes update item lifecycle timestamps and automatically sync the parent order/COD payment status.
- Cart quantity controls prevent increasing above stock.
- Add-to-cart prevents adding more than available stock.
- Relevant pages are revalidated after stock changes:
  - `/`
  - `/products`
  - `/products/[id]`
  - `/cart`
  - `/orders`

## Known Remaining Architecture Work

The architecture is improved but not final-production yet.

Next best improvements:

1. Continue auditing live RLS behavior after real buyer/seller testing.
2. Expand browser E2E coverage to authenticated checkout/status flows with dedicated test users.
3. Configure an external error drain/webhook if the project upgrades beyond Vercel Hobby-level observability.
4. Add richer seller fulfillment workflows such as cancellation reasons and pickup OTP verification.
5. Consider a true multi-image product model if product galleries become important.

## Current Honest Architecture Rating

- MVP speed: 8/10
- Current readability: 9/10
- Reusability: 9.5/10
- Scalability: 9.5/10
- Type safety: 9/10
- Production readiness: 9.7/10

## How To Rebuild Context In A New Codex Session

Use this prompt:

```txt
I switched accounts. This is my NearbyNow project.
First read PROJECT_CONTEXT.md, package.json, src/app/page.tsx, src/app/products/[id]/page.tsx, src/features/products/components/product-card.tsx, and src/repositories.
Do not edit anything yet.
Summarize the project architecture, current state, known issues, and next best improvements.
```

Then use feature-specific prompts like:

```txt
I am learning by building NearbyNow.
My current goal is: [feature].
Use my existing code. Teach me only the concepts needed for this feature.
Explain the relevant files first, then give me one small change to make.
```
