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
    from public.products
    join public.shops
      on shops.id = products.shop_id
    where products.id = order_items.product_id
    and shops.seller_profile_id = auth.uid()
  );

  get diagnostics v_updated_count = row_count;

  return v_updated_count = 1;
end;
$$;

revoke all on function public.update_seller_order_item_status(uuid, text) from public;

grant execute on function public.update_seller_order_item_status(uuid, text) to authenticated;
