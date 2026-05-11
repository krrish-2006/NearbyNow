# NearbyNow Project Context

## What This Project Is

NearbyNow is a local marketplace app for discovering and buying products from nearby shops. The current MVP is focused on Durgapur, with other cities shown as coming soon.

The app has two main modes:

- Buyer: browse products, search/filter, view product details, add to cart, buy now, place COD orders, view orders.
- Seller: become a seller, manage shop/profile, add/edit/delete products, view seller orders.

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

Important relationships:

- A seller profile owns one shop.
- A shop owns many products.
- Products belong to categories.
- Users own cart items.
- Users own orders.
- Orders have order items.

Important RLS/policy note:

- Products are public-readable.
- Shops need public select access so buyer pages can show shop names.
- A migration was added for this: `20260511080728_allow_public_shop_select.sql`.

Migration hygiene:

- Supabase migration files must use 14-digit timestamp versions like `YYYYMMDDHHMMSS_name.sql`.
- Older short migration names were renamed:
  - `20260509165740_create_orders.sql`
  - `20260510095056_phase5_checkout_foundation.sql`
  - `20260511080728_allow_public_shop_select.sql`

## Current Product/Stock Behavior

- Product cards show `In stock: X`.
- Product detail page shows `In stock: X` below price.
- Direct Buy Now decrements stock by purchased quantity.
- Cart checkout decrements stock for cart quantities.
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

1. Refactor seller pages to use typed repositories and remove remaining `any`.
2. Move checkout/order creation and stock decrement into an atomic Postgres RPC or transaction-like server function to prevent race conditions.
3. Add tests for checkout pricing, cart quantity limits, stock decrement, and order creation.
4. Audit RLS policies for buyer/seller security.
5. Replace deprecated `middleware.ts` convention with Next.js `proxy.ts`.
6. Clean up full repo lint failures, including generated/duplicate database type files if needed.
7. Consider standard result types for all server actions.

## Current Honest Architecture Rating

- MVP speed: 8/10
- Current readability: 7.5/10
- Reusability: 7.5/10
- Scalability: 6.5/10
- Type safety: 6.5/10
- Production readiness: 5.5/10

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
