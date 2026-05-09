create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,

  total_amount numeric not null default 0,

  payment_method text not null default 'COD',

  status text not null default 'PENDING',

  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),

  order_id uuid not null references public.orders(id) on delete cascade,

  product_id uuid not null references public.products(id) on delete cascade,

  quantity integer not null,

  price numeric not null,

  created_at timestamptz not null default now()
);

alter table public.orders
enable row level security;

alter table public.order_items
enable row level security;

create policy "Users can view own orders"
on public.orders
for select
using (auth.uid() = user_id);

create policy "Users can insert own orders"
on public.orders
for insert
with check (auth.uid() = user_id);

create policy "Users can view own order items"
on public.order_items
for select
using (
  exists (
    select 1
    from public.orders
    where orders.id = order_items.order_id
    and orders.user_id = auth.uid()
  )
);
