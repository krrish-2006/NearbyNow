create extension if not exists vector with schema extensions;

alter table public.products
add column if not exists search_embedding extensions.vector(384);

create or replace function public.search_marketplace_products(
  p_query_embedding text,
  p_category_id uuid default null,
  p_max_price numeric default null,
  p_prefer_cheap boolean default false,
  p_match_count integer default 24
)
returns table (
  id uuid,
  title text,
  description text,
  price numeric,
  image_url text,
  stock_quantity integer,
  shop_name text,
  similarity double precision
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    products.id,
    products.title,
    products.description,
    products.price,
    products.image_url,
    products.stock_quantity,
    shops.name as shop_name,
    1 - (products.search_embedding <=> p_query_embedding::vector) as similarity
  from public.products
  join public.shops
    on shops.id = products.shop_id
  where products.search_embedding is not null
  and products.is_active = true
  and (p_category_id is null or products.category_id = p_category_id)
  and (p_max_price is null or products.price <= p_max_price)
  order by
    case when p_prefer_cheap then products.price end asc,
    products.search_embedding <=> p_query_embedding::vector asc,
    products.created_at desc
  limit least(greatest(p_match_count, 1), 50);
$$;

grant execute on function public.search_marketplace_products(
  text,
  uuid,
  numeric,
  boolean,
  integer
) to anon, authenticated;
