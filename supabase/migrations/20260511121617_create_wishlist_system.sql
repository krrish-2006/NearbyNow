create table if not exists public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint unique_wishlist_per_user_product unique (user_id, product_id)
);

alter table public.wishlists enable row level security;

create index if not exists idx_wishlists_user_id
on public.wishlists(user_id);

create index if not exists idx_wishlists_product_id
on public.wishlists(product_id);

drop policy if exists "Users can view own wishlist items"
on public.wishlists;

create policy "Users can view own wishlist items"
on public.wishlists
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own wishlist items"
on public.wishlists;

create policy "Users can insert own wishlist items"
on public.wishlists
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own wishlist items"
on public.wishlists;

create policy "Users can delete own wishlist items"
on public.wishlists
for delete
to authenticated
using (auth.uid() = user_id);

create or replace function public.get_shop_wishlist_count(
  p_shop_id uuid
)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(count(wishlists.id), 0)::integer
  from public.wishlists
  join public.products
    on products.id = wishlists.product_id
  join public.shops
    on shops.id = products.shop_id
  where products.shop_id = p_shop_id
  and shops.seller_profile_id = auth.uid();
$$;

revoke all on function public.get_shop_wishlist_count(uuid) from public;

grant execute on function public.get_shop_wishlist_count(uuid) to authenticated;
