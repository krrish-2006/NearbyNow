-- =====================================================
-- DROP OLD PRODUCTS TABLE (IF EXISTS)
-- =====================================================

drop table if exists public.products cascade;

-- =====================================================
-- CATEGORIES TABLE
-- =====================================================

create table public.categories (
  id uuid primary key default gen_random_uuid(),

  name text not null unique,

  slug text not null unique,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);

-- =====================================================
-- SHOPS TABLE
-- =====================================================

create table public.shops (
  id uuid primary key default gen_random_uuid(),

  seller_profile_id uuid not null
    references public.profiles(id)
    on delete cascade,

  name text not null,

  description text,

  logo_url text,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now(),

  constraint unique_shop_per_seller
    unique (seller_profile_id)
);

-- =====================================================
-- PRODUCTS TABLE
-- =====================================================

create table public.products (
  id uuid primary key default gen_random_uuid(),

  shop_id uuid not null
    references public.shops(id)
    on delete cascade,

  category_id uuid
    references public.categories(id)
    on delete set null,

  title text not null,

  description text,

  price numeric(10,2) not null check (price >= 0),

  image_url text,

  stock_quantity integer not null default 0
    check (stock_quantity >= 0),

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);

-- =====================================================
-- INDEXES
-- =====================================================

create index idx_categories_slug
on public.categories(slug);

create index idx_shops_seller_profile_id
on public.shops(seller_profile_id);

create index idx_products_shop_id
on public.products(shop_id);

create index idx_products_category_id
on public.products(category_id);

create index idx_products_created_at
on public.products(created_at desc);

create index idx_products_title
on public.products(title);

-- =====================================================
-- UPDATED_AT TRIGGERS
-- =====================================================

create trigger set_categories_updated_at
before update on public.categories
for each row
execute function public.handle_updated_at();

create trigger set_shops_updated_at
before update on public.shops
for each row
execute function public.handle_updated_at();

create trigger set_products_updated_at
before update on public.products
for each row
execute function public.handle_updated_at();

-- =====================================================
-- ENABLE RLS
-- =====================================================

alter table public.categories enable row level security;

alter table public.shops enable row level security;

alter table public.products enable row level security;