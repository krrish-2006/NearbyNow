# Database

## Core Tables

- `profiles`: user profile and role information.
- `cities`: supported city list.
- `categories`: product categories.
- `shops`: seller shops.
- `products`: shop products.
- `cart_items`: buyer cart items.
- `orders`: buyer orders.
- `order_items`: products inside each order.
- `wishlists`: buyer wishlist/favorite rows for products.
- `shop_pickup_locations`: protected seller-confirmed pickup addresses and coordinates.

## Main Relationships

- `profiles.id` maps to Supabase auth user IDs.
- `shops.seller_profile_id` references `profiles.id`.
- `products.shop_id` references `shops.id`.
- `products.category_id` references `categories.id`.
- `cart_items.user_id` references auth users.
- `cart_items.product_id` references `products.id`.
- `orders.user_id` references auth users.
- `order_items.order_id` references `orders.id`.
- `order_items.product_id` references `products.id`.
- `order_items.shop_id` references `shops.id` and stores the seller shop responsible for that line item.
- `wishlists.user_id` references auth users.
- `wishlists.product_id` references `products.id`.
- `shop_pickup_locations.shop_id` references `shops.id` and stores one pickup location per shop.

## Important RLS Notes

- Products are public-readable.
- Categories are public-readable.
- Shops need public select access so buyer pages can show seller/shop names.
- Sellers should only create/update/delete products for their own shop.
- Buyers should only read/write their own cart and orders.
- Buyers should only read/write/delete their own wishlist rows.
- Sellers should not directly mutate wishlist rows.
- Seller wishlist metrics are exposed through `get_shop_wishlist_count`, which only counts products owned by the current seller's shop.
- Sellers read order data through security-definer RPCs scoped to `order_items.shop_id`, avoiding recursive orders/order_items policies.
- Pickup locations are not stored on the public-readable `shops` table. Sellers manage their own pickup location, and buyers receive pickup details through `get_buyer_order_items` only for their confirmed/completed order items.

## Important Migration Notes

Migration filenames must be valid 14-digit timestamp versions:

```txt
YYYYMMDDHHMMSS_name.sql
```

Known renamed migrations:

- `20260509165740_create_orders.sql`
- `20260510095056_phase5_checkout_foundation.sql`
- `20260511080728_allow_public_shop_select.sql`
- `20260511095439_atomic_checkout_rpc.sql`
- `20260511121617_create_wishlist_system.sql`
- `20260511143000_create_seller_cart_quantity_rpc.sql`

The public shop select policy was added so product detail and product cards can show shop names to buyers.

`20260512103000_formalize_multishop_fulfillment.sql` adds explicit shop-owned fulfillment, item lifecycle timestamps, derived parent order status, and normalized COD payment status.

`20260513143000_add_shop_pickup_locations.sql` adds protected seller pickup locations and updates buyer/seller order RPCs to expose pickup details safely.

## Stock Behavior

- `products.stock_quantity` is the source of truth.
- Product cards show `In stock: X`.
- Product detail pages show `In stock: X`.
- Cart and direct checkout validate quantity against stock.
- Successful cart and direct orders decrement stock through atomic Postgres RPCs.
- Cart checkout supports products from multiple shops.
- `order_items.status` tracks seller fulfillment status per product line.
- `order_items.shop_id` records which seller shop owns that line, even when the parent order contains multiple shops.
- `order_items.status_updated_at`, `confirmed_at`, `completed_at`, and `cancelled_at` record fulfillment lifecycle timestamps.
- Parent `orders.status` is derived from item statuses.
- COD `orders.payment_status` is derived as `COD_PENDING`, `COD_COLLECTED`, or `CANCELLED`.
- Sellers can view order items for their own shop products.
- Sellers can update only the status of their own shop's order items.
- Buyers see pickup address, map coordinates, pickup window, and seller instructions only after the seller confirms/completes that item.
- Buyers can only read/write their own cart items through cart item RLS policies.
- Seller order metrics count order items scoped to the seller's own shop products.
- `Orders in Cart` counts the total quantity currently selected in buyer carts for products owned by the seller's shop.
- `Orders Completed` counts order items with `COMPLETED` status.
- `Wishlisted Products` counts wishlist rows for products owned by the seller's shop.

## Future Database Work

- Add local Supabase integration tests for wishlist RLS and seller wishlist metrics.
- Audit live RLS behavior with real buyer/seller test accounts.
- Audit RLS policies after each new feature.
- Add pickup OTP/code verification and cancellation reasons.
- Add reviews tables when that feature is built.
- Add a product images table if real multi-image galleries become required.
