alter table public.order_items
drop constraint if exists order_items_status_check;

alter table public.order_items
add constraint order_items_status_check
check (
  status in (
    'PENDING',
    'CONFIRMED',
    'COMPLETED',
    'CANCELLED'
  )
);

alter table public.orders
drop constraint if exists orders_status_check;

alter table public.orders
add constraint orders_status_check
check (
  status in (
    'PENDING',
    'CONFIRMED',
    'COMPLETED',
    'CANCELLED'
  )
);

create or replace function public.get_seller_order_items(
  p_shop_id uuid
)
returns table (
  id uuid,
  quantity integer,
  price numeric,
  status text,
  product_id uuid,
  product_title text,
  order_id uuid,
  buyer_user_id uuid,
  payment_method text,
  ordered_at timestamptz,
  order_total_amount numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    order_items.id,
    order_items.quantity,
    order_items.price,
    order_items.status,
    products.id as product_id,
    products.title as product_title,
    orders.id as order_id,
    orders.user_id as buyer_user_id,
    orders.payment_method,
    orders.created_at as ordered_at,
    orders.total_amount as order_total_amount
  from public.order_items
  join public.products
    on products.id = order_items.product_id
  join public.shops
    on shops.id = products.shop_id
  join public.orders
    on orders.id = order_items.order_id
  where products.shop_id = p_shop_id
  and shops.seller_profile_id = auth.uid()
  order by orders.created_at desc;
$$;

revoke all on function public.get_seller_order_items(uuid) from public;

grant execute on function public.get_seller_order_items(uuid) to authenticated;
