drop policy if exists "Sellers can update own shop order item status"
on public.order_items;

create policy "Sellers can update own shop order item status"
on public.order_items
for update
to authenticated
using (
  exists (
    select 1
    from public.products
    join public.shops
      on shops.id = products.shop_id
    where products.id = order_items.product_id
    and shops.seller_profile_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.products
    join public.shops
      on shops.id = products.shop_id
    where products.id = order_items.product_id
    and shops.seller_profile_id = auth.uid()
  )
);
