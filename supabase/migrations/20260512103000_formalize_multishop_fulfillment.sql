alter table public.order_items
add column if not exists shop_id uuid;

alter table public.order_items
add column if not exists status_updated_at timestamptz not null default now();

alter table public.order_items
add column if not exists confirmed_at timestamptz;

alter table public.order_items
add column if not exists completed_at timestamptz;

alter table public.order_items
add column if not exists cancelled_at timestamptz;

alter table public.orders
add column if not exists updated_at timestamptz not null default now();

update public.order_items
set shop_id = products.shop_id
from public.products
where products.id = order_items.product_id
and order_items.shop_id is null;

alter table public.order_items
alter column shop_id set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'order_items_shop_id_fkey'
  ) then
    alter table public.order_items
    add constraint order_items_shop_id_fkey
    foreign key (shop_id)
    references public.shops(id)
    on delete restrict;
  end if;
end;
$$;

create index if not exists idx_order_items_shop_id
on public.order_items(shop_id);

create index if not exists idx_order_items_shop_status
on public.order_items(shop_id, status);

update public.orders
set payment_status = 'COD_PENDING'
where payment_status = 'cod_pending';

alter table public.orders
alter column payment_status set default 'COD_PENDING';

alter table public.orders
drop constraint if exists orders_payment_method_check;

alter table public.orders
add constraint orders_payment_method_check
check (payment_method in ('COD'));

alter table public.orders
drop constraint if exists orders_payment_status_check;

alter table public.orders
add constraint orders_payment_status_check
check (
  payment_status in (
    'COD_PENDING',
    'COD_COLLECTED',
    'CANCELLED'
  )
);

create or replace function public.set_order_item_fulfillment_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.shop_id is null then
    select products.shop_id
    into new.shop_id
    from public.products
    where products.id = new.product_id;
  end if;

  if new.shop_id is null then
    raise exception 'product_shop_required';
  end if;

  if tg_op = 'INSERT' then
    new.status_updated_at := coalesce(new.status_updated_at, now());
  elsif old.status is distinct from new.status then
    new.status_updated_at := now();

    if new.status = 'CONFIRMED' then
      new.confirmed_at := coalesce(new.confirmed_at, now());
    elsif new.status = 'COMPLETED' then
      new.completed_at := coalesce(new.completed_at, now());
    elsif new.status = 'CANCELLED' then
      new.cancelled_at := coalesce(new.cancelled_at, now());
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists set_order_item_fulfillment_defaults
on public.order_items;

create trigger set_order_item_fulfillment_defaults
before insert or update on public.order_items
for each row
execute function public.set_order_item_fulfillment_defaults();

create or replace function public.sync_order_status_from_items(
  p_order_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total_items integer;
  v_cancelled_items integer;
  v_completed_items integer;
  v_confirmed_items integer;
  v_order_status text;
  v_payment_status text;
begin
  select
    count(*)::integer,
    count(*) filter (where status = 'CANCELLED')::integer,
    count(*) filter (where status = 'COMPLETED')::integer,
    count(*) filter (where status = 'CONFIRMED')::integer
  into
    v_total_items,
    v_cancelled_items,
    v_completed_items,
    v_confirmed_items
  from public.order_items
  where order_id = p_order_id;

  if v_total_items = 0 then
    v_order_status := 'PENDING';
  elsif v_cancelled_items = v_total_items then
    v_order_status := 'CANCELLED';
  elsif v_completed_items = v_total_items then
    v_order_status := 'COMPLETED';
  elsif v_confirmed_items > 0 or v_completed_items > 0 then
    v_order_status := 'CONFIRMED';
  else
    v_order_status := 'PENDING';
  end if;

  v_payment_status := case
    when v_order_status = 'COMPLETED' then 'COD_COLLECTED'
    when v_order_status = 'CANCELLED' then 'CANCELLED'
    else 'COD_PENDING'
  end;

  update public.orders
  set
    status = v_order_status,
    payment_status = v_payment_status,
    updated_at = now()
  where id = p_order_id;
end;
$$;

create or replace function public.sync_order_status_from_items_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.sync_order_status_from_items(old.order_id);
    return old;
  end if;

  perform public.sync_order_status_from_items(new.order_id);
  return new;
end;
$$;

drop trigger if exists sync_order_status_from_items
on public.order_items;

create trigger sync_order_status_from_items
after insert or update of status or delete on public.order_items
for each row
execute function public.sync_order_status_from_items_trigger();

create or replace function public.protect_order_item_seller_status_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.order_id is distinct from new.order_id
    or old.product_id is distinct from new.product_id
    or old.shop_id is distinct from new.shop_id
    or old.quantity is distinct from new.quantity
    or old.price is distinct from new.price
    or old.created_at is distinct from new.created_at
  then
    raise exception 'order_item_status_only';
  end if;

  return new;
end;
$$;

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
    'COD_PENDING',
    'direct',
    0
  )
  returning id into v_order_id;

  insert into public.order_items (
    order_id,
    product_id,
    shop_id,
    quantity,
    price,
    status
  )
  values (
    v_order_id,
    v_product.id,
    v_product.shop_id,
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
    'COD_PENDING',
    'cart',
    0
  )
  returning id into v_order_id;

  insert into public.order_items (
    order_id,
    product_id,
    shop_id,
    quantity,
    price,
    status
  )
  select
    v_order_id,
    cart_item.product_id,
    product.shop_id,
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

create or replace function public.seller_can_update_order_item_status(
  p_order_item_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.order_items
    join public.shops
      on shops.id = order_items.shop_id
    where order_items.id = p_order_item_id
    and shops.seller_profile_id = auth.uid()
  );
$$;

create or replace function public.update_seller_order_item_status(
  p_order_item_id uuid,
  p_status text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated_count integer;
begin
  if auth.uid() is null then
    raise exception 'auth_required';
  end if;

  if p_status not in ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED') then
    raise exception 'invalid_order_status';
  end if;

  update public.order_items
  set status = p_status
  where id = p_order_item_id
  and exists (
    select 1
    from public.shops
    where shops.id = order_items.shop_id
    and shops.seller_profile_id = auth.uid()
  );

  get diagnostics v_updated_count = row_count;

  return v_updated_count = 1;
end;
$$;

drop function if exists public.get_seller_order_items(uuid);

create function public.get_seller_order_items(
  p_shop_id uuid
)
returns table (
  id uuid,
  quantity integer,
  price numeric,
  status text,
  status_updated_at timestamptz,
  confirmed_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  product_id uuid,
  product_title text,
  shop_id uuid,
  shop_name text,
  order_id uuid,
  buyer_user_id uuid,
  payment_method text,
  payment_status text,
  order_status text,
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
    order_items.status_updated_at,
    order_items.confirmed_at,
    order_items.completed_at,
    order_items.cancelled_at,
    products.id as product_id,
    products.title as product_title,
    shops.id as shop_id,
    shops.name as shop_name,
    orders.id as order_id,
    orders.user_id as buyer_user_id,
    orders.payment_method,
    orders.payment_status,
    orders.status as order_status,
    orders.created_at as ordered_at,
    orders.total_amount as order_total_amount
  from public.order_items
  join public.products
    on products.id = order_items.product_id
  join public.shops
    on shops.id = order_items.shop_id
  join public.orders
    on orders.id = order_items.order_id
  where order_items.shop_id = p_shop_id
  and shops.seller_profile_id = auth.uid()
  order by orders.created_at desc;
$$;

drop function if exists public.get_buyer_order_items();

create function public.get_buyer_order_items()
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
  order_updated_at timestamptz,
  order_item_id uuid,
  quantity integer,
  price numeric,
  item_status text,
  item_status_updated_at timestamptz,
  shop_id uuid,
  shop_name text,
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
    orders.updated_at as order_updated_at,
    order_items.id as order_item_id,
    order_items.quantity,
    order_items.price,
    order_items.status as item_status,
    order_items.status_updated_at as item_status_updated_at,
    shops.id as shop_id,
    shops.name as shop_name,
    products.title as product_title
  from public.orders
  join public.order_items
    on order_items.order_id = orders.id
  join public.products
    on products.id = order_items.product_id
  join public.shops
    on shops.id = order_items.shop_id
  where orders.user_id = auth.uid()
  order by orders.created_at desc;
$$;

revoke all on function public.get_seller_order_items(uuid) from public;
revoke all on function public.get_buyer_order_items() from public;

grant execute on function public.get_seller_order_items(uuid) to authenticated;
grant execute on function public.get_buyer_order_items() to authenticated;

drop policy if exists "Sellers can view own shop order items"
on public.order_items;

create policy "Sellers can view own shop order items"
on public.order_items
for select
to authenticated
using (
  exists (
    select 1
    from public.shops
    where shops.id = order_items.shop_id
    and shops.seller_profile_id = auth.uid()
  )
);

drop policy if exists "Sellers can update own shop order item status"
on public.order_items;

create policy "Sellers can update own shop order item status"
on public.order_items
for update
to authenticated
using (
  exists (
    select 1
    from public.shops
    where shops.id = order_items.shop_id
    and shops.seller_profile_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.shops
    where shops.id = order_items.shop_id
    and shops.seller_profile_id = auth.uid()
  )
);

revoke all on function public.sync_order_status_from_items(uuid) from public;
revoke all on function public.sync_order_status_from_items_trigger() from public;
revoke all on function public.set_order_item_fulfillment_defaults() from public;
