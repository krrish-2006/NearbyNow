create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  constraint unique_cart_item_per_user_product unique (user_id, product_id)
);

alter table public.cart_items enable row level security;

create index if not exists idx_cart_items_user_id
on public.cart_items(user_id);

create index if not exists idx_cart_items_product_id
on public.cart_items(product_id);

drop policy if exists "Users can view own cart items"
on public.cart_items;

create policy "Users can view own cart items"
on public.cart_items
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own cart items"
on public.cart_items;

create policy "Users can insert own cart items"
on public.cart_items
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own cart items"
on public.cart_items;

create policy "Users can update own cart items"
on public.cart_items
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own cart items"
on public.cart_items;

create policy "Users can delete own cart items"
on public.cart_items
for delete
to authenticated
using (auth.uid() = user_id);

alter table public.orders
drop constraint if exists orders_status_check;

alter table public.orders
add constraint orders_status_check
check (
  status in (
    'PENDING',
    'CONFIRMED',
    'READY_FOR_PICKUP',
    'COMPLETED',
    'CANCELLED'
  )
);

alter table public.order_items
add column if not exists status text not null default 'PENDING';

alter table public.order_items
drop constraint if exists order_items_status_check;

alter table public.order_items
add constraint order_items_status_check
check (
  status in (
    'PENDING',
    'CONFIRMED',
    'READY_FOR_PICKUP',
    'COMPLETED',
    'CANCELLED'
  )
);

create index if not exists idx_order_items_status
on public.order_items(status);

create or replace function public.protect_order_item_seller_status_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.order_id is distinct from new.order_id
    or old.product_id is distinct from new.product_id
    or old.quantity is distinct from new.quantity
    or old.price is distinct from new.price
    or old.created_at is distinct from new.created_at
  then
    raise exception 'order_item_status_only';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_order_item_seller_status_update
on public.order_items;

create trigger protect_order_item_seller_status_update
before update on public.order_items
for each row
execute function public.protect_order_item_seller_status_update();

create or replace function public.place_direct_cod_order(
  p_product_id uuid,
  p_quantity integer
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_product public.products%rowtype;
  v_order_id uuid;
begin
  if v_user_id is null then
    raise exception 'auth_required';
  end if;

  if p_quantity is null or p_quantity < 1 then
    raise exception 'invalid_quantity';
  end if;

  select *
  into v_product
  from public.products
  where id = p_product_id
  for update;

  if not found or not v_product.is_active then
    raise exception 'product_unavailable';
  end if;

  if v_product.stock_quantity < p_quantity then
    raise exception 'insufficient_stock';
  end if;

  insert into public.orders (
    user_id,
    total_amount,
    payment_method,
    payment_status,
    checkout_source,
    platform_fee
  )
  values (
    v_user_id,
    v_product.price * p_quantity,
    'COD',
    'cod_pending',
    'direct',
    0
  )
  returning id into v_order_id;

  insert into public.order_items (
    order_id,
    product_id,
    quantity,
    price,
    status
  )
  values (
    v_order_id,
    v_product.id,
    p_quantity,
    v_product.price,
    'PENDING'
  );

  update public.products
  set stock_quantity = stock_quantity - p_quantity
  where id = v_product.id;

  return v_order_id;
end;
$$;

create or replace function public.place_cart_cod_order()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_order_id uuid;
  v_total numeric;
begin
  if v_user_id is null then
    raise exception 'auth_required';
  end if;

  if not exists (
    select 1
    from public.cart_items
    where user_id = v_user_id
  ) then
    raise exception 'empty_cart';
  end if;

  perform 1
  from public.products product
  where exists (
    select 1
    from public.cart_items cart_item
    where cart_item.user_id = v_user_id
    and cart_item.product_id = product.id
  )
  for update;

  if exists (
    select 1
    from public.cart_items cart_item
    join public.products product
      on product.id = cart_item.product_id
    where cart_item.user_id = v_user_id
    and (
      cart_item.quantity < 1
      or not product.is_active
      or product.stock_quantity < cart_item.quantity
    )
  ) then
    raise exception 'cart_item_unavailable';
  end if;

  select coalesce(sum(product.price * cart_item.quantity), 0)
  into v_total
  from public.cart_items cart_item
  join public.products product
    on product.id = cart_item.product_id
  where cart_item.user_id = v_user_id;

  insert into public.orders (
    user_id,
    total_amount,
    payment_method,
    payment_status,
    checkout_source,
    platform_fee
  )
  values (
    v_user_id,
    v_total,
    'COD',
    'cod_pending',
    'cart',
    0
  )
  returning id into v_order_id;

  insert into public.order_items (
    order_id,
    product_id,
    quantity,
    price,
    status
  )
  select
    v_order_id,
    cart_item.product_id,
    cart_item.quantity,
    product.price,
    'PENDING'
  from public.cart_items cart_item
  join public.products product
    on product.id = cart_item.product_id
  where cart_item.user_id = v_user_id;

  update public.products product
  set stock_quantity = product.stock_quantity - cart_item.quantity
  from public.cart_items cart_item
  where cart_item.user_id = v_user_id
  and cart_item.product_id = product.id;

  delete from public.cart_items
  where user_id = v_user_id;

  return v_order_id;
end;
$$;

revoke all on function public.place_direct_cod_order(uuid, integer) from public;
revoke all on function public.place_cart_cod_order() from public;

grant execute on function public.place_direct_cod_order(uuid, integer) to authenticated;
grant execute on function public.place_cart_cod_order() to authenticated;

create or replace function public.seller_can_update_order_item_status(
  p_order_item_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    auth.uid() is not null
    and exists (
      select 1
      from public.order_items
      join public.products
        on products.id = order_items.product_id
      join public.shops
        on shops.id = products.shop_id
      where order_items.id = p_order_item_id
      and shops.seller_profile_id = auth.uid()
    );
$$;

revoke all on function public.seller_can_update_order_item_status(uuid) from public;

grant execute on function public.seller_can_update_order_item_status(uuid) to authenticated;

drop policy if exists "Sellers can view own shop order items"
on public.order_items;

create policy "Sellers can view own shop order items"
on public.order_items
for select
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
);

drop policy if exists "Sellers can view orders containing own shop products"
on public.orders;

create policy "Sellers can view orders containing own shop products"
on public.orders
for select
to authenticated
using (
  exists (
    select 1
    from public.order_items
    join public.products
      on products.id = order_items.product_id
    join public.shops
      on shops.id = products.shop_id
    where order_items.order_id = orders.id
    and shops.seller_profile_id = auth.uid()
  )
);

drop policy if exists "Sellers can update orders containing own shop products"
on public.orders;

drop policy if exists "Sellers can update own shop order item status"
on public.order_items;

create policy "Sellers can update own shop order item status"
on public.order_items
for update
to authenticated
using (public.seller_can_update_order_item_status(order_items.id))
with check (public.seller_can_update_order_item_status(order_items.id));
