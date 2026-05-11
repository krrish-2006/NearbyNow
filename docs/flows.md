# App Flows

## Buyer Marketplace Flow

1. Buyer visits `/`.
2. App reads selected city from `selected_city_id` cookie.
3. If city is not Durgapur, app shows coming soon.
4. App fetches products through `getMarketplaceProducts`.
5. Product cards render product image, shop name, title, description, price, and stock.
6. Search and category filters update query params and refetch products.

## Product Detail Flow

1. Buyer clicks a product card.
2. Next.js opens `/products/[id]`.
3. App fetches product details through `getProductDetails`.
4. App checks whether the current user already has the product in cart.
5. App checks whether the current user has wishlisted the product.
6. Page shows image, title, category, description, price, stock, shop name, wishlist toggle, Add to Cart/View Cart, and Buy Now.
7. Related products are fetched through `getRelatedProducts`.

## Wishlist Flow

1. Buyer clicks the wishlist button on a product detail page.
2. `toggleWishlistAction` validates auth.
3. Action checks for an existing wishlist row through `getWishlistItemId`.
4. Existing rows are removed; missing rows are inserted.
5. RLS allows buyers to mutate only their own wishlist rows.
6. Seller wishlist metrics update because they count live wishlist rows for the seller's products.

## Cart Flow

1. Buyer clicks Add to Cart.
2. `addToCartAction` validates auth, product availability, and stock through shared cart quantity rules.
3. Product is inserted into `cart_items` or existing quantity is incremented.
4. Cart page fetches typed cart items through `getCartItemsByUserId`.
5. Cart quantity controls prevent quantity from exceeding stock.
6. `updateCartQuantityAction` also validates quantity server-side.
7. Seller Orders uses `get_shop_cart_quantity` to show the total quantity of this seller's products currently selected in buyer carts.

## Cart Checkout Flow

1. Buyer clicks Place COD Order in `/cart`.
2. `placeOrderAction` fetches cart items for page revalidation.
3. Action validates the cart is not empty.
4. Action calls the `place_cart_cod_order` Postgres RPC.
5. RPC locks product rows, validates every item is active and in stock, creates the order, creates `PENDING` order items, decrements stock, and clears the cart atomically.
6. The cart may include products from multiple shops because fulfillment status lives on each order item.
7. Action revalidates cart, marketplace, products, product detail pages, and orders.
8. Buyer is redirected to `/orders`.
9. If checkout fails, the cart form shows a structured error.

## Direct Buy Now Flow

1. Buyer clicks Buy Now on product detail.
2. App redirects to `/checkout/direct?productId=...`.
3. Checkout page shows product summary and pricing.
4. Buyer places order.
5. `placeDirectOrderAction` validates auth, product status, and stock.
6. Action calls the `place_direct_cod_order` Postgres RPC.
7. RPC locks the product row, creates the order and order item, and decrements stock atomically.
8. Action revalidates affected pages.
9. Buyer is redirected to `/orders`.
10. If checkout fails, the direct checkout form shows a structured error.

## Seller Product Flow

1. Seller opens `/seller/products`.
2. Seller can add, edit, or delete products.
3. Product form validates with Zod and React Hook Form.
4. Description is limited to 50 words.
5. The image picker hides the browser default file text and supports selecting up to five files.
6. Current database storage saves one primary image URL; create/edit use the first selected file as the primary image.
7. Product create/update/delete actions revalidate seller product pages.
8. Cancel Update returns to `/seller/products` without saving.

## Seller Profile Flow

1. Seller opens `/seller/profile`.
2. Profile shows account information and a City select for the shop.
3. `updateShopCityAction` validates the current seller, updates the seller's shop city through a repository helper, and revalidates the profile page.
4. `/seller` redirects to `/seller/profile`.
5. `/seller/settings` redirects to `/seller/profile` for old links.

## Seller Order Status Flow

1. Seller opens `/seller/orders`.
2. Seller sees metric cards for cart quantity, wishlisted products, and completed orders.
3. Seller sees order items for products from their own shop.
4. Seller status changes validate against the shared order status list.
5. Sellers can choose Pending, Confirmed, Completed, or Cancelled.
6. The database allows sellers to update only `order_items.status` for their own products.
7. The buyer orders page reads the same `order_items.status`, so seller status changes show there too.
8. One seller cannot update another seller's items in the same multi-shop order.

## Auth/Role Flow

1. User signs in through Supabase Auth.
2. App reads the current user through Supabase server/client helpers.
3. Profile role determines whether seller UI is shown.
4. Seller-only pages redirect when user is not authenticated or not a seller.
