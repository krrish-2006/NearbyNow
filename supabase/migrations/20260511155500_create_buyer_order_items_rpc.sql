create or replace function public.get_buyer_order_items()
returns table (
  order_id uuid,
  order_user_id uuid,
  total_amount numeric,
  payment_method text,
  payment_status text,
  checkout_source text,
  platform_fee numeric,
  order_status text,
  order_created_at timestamptz,
  order_item_id uuid,
  quantity integer,
  price numeric,
  item_status text,
  product_title text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    orders.id as order_id,
    orders.user_id as order_user_id,
    orders.total_amount,
    orders.payment_method,
    orders.payment_status,
    orders.checkout_source,
    orders.platform_fee,
    orders.status as order_status,
    orders.created_at as order_created_at,
    order_items.id as order_item_id,
    order_items.quantity,
    order_items.price,
    order_items.status as item_status,
    products.title as product_title
  from public.orders
  join public.order_items
    on order_items.order_id = orders.id
  join public.products
    on products.id = order_items.product_id
  where orders.user_id = auth.uid()
  order by orders.created_at desc;
$$;

revoke all on function public.get_buyer_order_items() from public;

grant execute on function public.get_buyer_order_items() to authenticated;
