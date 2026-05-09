-- =====================================================
-- PRODUCT IMAGE STORAGE POLICIES
-- =====================================================

create policy "Authenticated users can upload product images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-images'
);

create policy "Anyone can view product images"
on storage.objects
for select
using (
  bucket_id = 'product-images'
);

create policy "Users can update own product images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'product-images'
  and owner = auth.uid()
);

create policy "Users can delete own product images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'product-images'
  and owner = auth.uid()
);