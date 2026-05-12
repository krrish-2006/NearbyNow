# Next Tasks

## Highest Priority

1. Push and verify any new migration before deploying features that depend on it.
2. Expand Playwright E2E coverage to authenticated buyer checkout and seller status updates with dedicated test users.
3. Add local Supabase integration coverage for wishlist RLS, seller wishlist metrics, and seller cart quantity metrics.
4. Audit live RLS behavior after real buyer/seller test accounts place orders and wishlist products.
5. Add richer seller fulfillment details such as cancellation reasons, pickup windows, or seller notes.

## Architecture Improvements

1. Standardize repository return shapes and error handling.
2. Continue moving checkout business rules into the checkout service layer.
3. Add typed repositories for any remaining route-level Supabase reads.
4. Add an external error webhook/log drain when you want monitoring outside Vercel logs.
5. Add better seller action feedback after city/product/order updates.

## Product Improvements

1. Add a buyer wishlist page.
2. Add product reviews and ratings.
3. Add seller shop public pages.
4. Add order cancellation/status tracking.
5. Add better empty/loading/error states.
6. Add a true product image gallery table if multiple stored images become required.

## Learning Goals

1. Learn current product-card and marketplace flow deeply.
2. Learn Server Actions through cart/order/product mutations.
3. Learn Supabase RLS through existing policies.
4. Learn PostgreSQL relationships through NearbyNow tables.
5. Learn deployment with Vercel and hosted Supabase.
