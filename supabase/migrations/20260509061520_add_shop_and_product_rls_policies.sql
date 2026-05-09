-- =====================================================
-- CATEGORIES POLICIES
-- =====================================================

create policy "Anyone can view categories"
on public.categories
for select
using (true);

-- =====================================================
-- SHOPS POLICIES
-- =====================================================

create policy "Seller can view own shop"
on public.shops
for select
to authenticated
using (
  seller_profile_id = auth.uid()
);

create policy "Seller can create own shop"
on public.shops
for insert
to authenticated
with check (
  seller_profile_id = auth.uid()
);

create policy "Seller can update own shop"
on public.shops
for update
to authenticated
using (
  seller_profile_id = auth.uid()
)
with check (
  seller_profile_id = auth.uid()
);

create policy "Seller can delete own shop"
on public.shops
for delete
to authenticated
using (
  seller_profile_id = auth.uid()
);

-- =====================================================
-- PRODUCTS POLICIES
-- =====================================================

create policy "Anyone can view products"
on public.products
for select
using (true);

create policy "Seller can create own shop products"
on public.products
for insert
to authenticated
with check (
  exists (
    select 1
    from public.shops
    where shops.id = products.shop_id
    and shops.seller_profile_id = auth.uid()
  )
);

create policy "Seller can update own shop products"
on public.products
for update
to authenticated
using (
  exists (
    select 1
    from public.shops
    where shops.id = products.shop_id
    and shops.seller_profile_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.shops
    where shops.id = products.shop_id
    and shops.seller_profile_id = auth.uid()
  )
);

create policy "Seller can delete own shop products"
on public.products
for delete
to authenticated
using (
  exists (
    select 1
    from public.shops
    where shops.id = products.shop_id
    and shops.seller_profile_id = auth.uid()
  )
);