create or replace function public.get_shop_cart_quantity(
  p_shop_id uuid
)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(cart_items.quantity), 0)::integer
  from public.cart_items
  join public.products
    on products.id = cart_items.product_id
  join public.shops
    on shops.id = products.shop_id
  where products.shop_id = p_shop_id
  and shops.seller_profile_id = auth.uid();
$$;

revoke all on function public.get_shop_cart_quantity(uuid) from public;

grant execute on function public.get_shop_cart_quantity(uuid) to authenticated;
