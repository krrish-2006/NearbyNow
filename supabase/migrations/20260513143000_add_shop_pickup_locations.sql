create table if not exists public.shop_pickup_locations (
  shop_id uuid primary key
    references public.shops(id)
    on delete cascade,
  address text not null,
  latitude numeric(9, 6) not null,
  longitude numeric(9, 6) not null,
  osm_place_id text,
  osm_display_name text,
  pickup_window text,
  pickup_instructions text,
  confirmed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shop_pickup_locations_latitude_check
    check (latitude >= -90 and latitude <= 90),
  constraint shop_pickup_locations_longitude_check
    check (longitude >= -180 and longitude <= 180)
);

create index if not exists idx_shop_pickup_locations_coordinates
on public.shop_pickup_locations(latitude, longitude);

drop trigger if exists set_shop_pickup_locations_updated_at
on public.shop_pickup_locations;

create trigger set_shop_pickup_locations_updated_at
before update on public.shop_pickup_locations
for each row
execute function public.handle_updated_at();

alter table public.shop_pickup_locations enable row level security;

drop policy if exists "Sellers can view own pickup location"
on public.shop_pickup_locations;

create policy "Sellers can view own pickup location"
on public.shop_pickup_locations
for select
to authenticated
using (
  exists (
    select 1
    from public.shops
    where shops.id = shop_pickup_locations.shop_id
    and shops.seller_profile_id = auth.uid()
  )
);

drop policy if exists "Sellers can create own pickup location"
on public.shop_pickup_locations;

create policy "Sellers can create own pickup location"
on public.shop_pickup_locations
for insert
to authenticated
with check (
  exists (
    select 1
    from public.shops
    where shops.id = shop_pickup_locations.shop_id
    and shops.seller_profile_id = auth.uid()
  )
);

drop policy if exists "Sellers can update own pickup location"
on public.shop_pickup_locations;

create policy "Sellers can update own pickup location"
on public.shop_pickup_locations
for update
to authenticated
using (
  exists (
    select 1
    from public.shops
    where shops.id = shop_pickup_locations.shop_id
    and shops.seller_profile_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.shops
    where shops.id = shop_pickup_locations.shop_id
    and shops.seller_profile_id = auth.uid()
  )
);

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
  pickup_address text,
  pickup_latitude numeric,
  pickup_longitude numeric,
  pickup_window text,
  pickup_instructions text,
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
    pickup.address as pickup_address,
    pickup.latitude as pickup_latitude,
    pickup.longitude as pickup_longitude,
    pickup.pickup_window,
    pickup.pickup_instructions,
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
  left join public.shop_pickup_locations pickup
    on pickup.shop_id = shops.id
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
  product_title text,
  pickup_address text,
  pickup_latitude numeric,
  pickup_longitude numeric,
  pickup_window text,
  pickup_instructions text
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
    products.title as product_title,
    case
      when order_items.status in ('CONFIRMED', 'COMPLETED')
        then pickup.address
      else null
    end as pickup_address,
    case
      when order_items.status in ('CONFIRMED', 'COMPLETED')
        then pickup.latitude
      else null
    end as pickup_latitude,
    case
      when order_items.status in ('CONFIRMED', 'COMPLETED')
        then pickup.longitude
      else null
    end as pickup_longitude,
    case
      when order_items.status in ('CONFIRMED', 'COMPLETED')
        then pickup.pickup_window
      else null
    end as pickup_window,
    case
      when order_items.status in ('CONFIRMED', 'COMPLETED')
        then pickup.pickup_instructions
      else null
    end as pickup_instructions
  from public.orders
  join public.order_items
    on order_items.order_id = orders.id
  join public.products
    on products.id = order_items.product_id
  join public.shops
    on shops.id = order_items.shop_id
  left join public.shop_pickup_locations pickup
    on pickup.shop_id = shops.id
  where orders.user_id = auth.uid()
  order by orders.created_at desc;
$$;

revoke all on function public.get_seller_order_items(uuid) from public;
revoke all on function public.get_buyer_order_items() from public;

grant execute on function public.get_seller_order_items(uuid) to authenticated;
grant execute on function public.get_buyer_order_items() to authenticated;
