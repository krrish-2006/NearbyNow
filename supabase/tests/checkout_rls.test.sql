begin;

create extension if not exists pgtap with schema extensions;

select plan(13);

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'buyer-one@example.com',
    'unused',
    now(),
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'buyer-two@example.com',
    'unused',
    now(),
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '20000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'seller-one@example.com',
    'unused',
    now(),
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '20000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'seller-two@example.com',
    'unused',
    now(),
    now(),
    now()
  );

update public.profiles
set role = 'seller'
where id in (
  '20000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000002'
);

insert into public.categories (id, name, slug)
values ('30000000-0000-0000-0000-000000000001', 'Test Category', 'test-category')
on conflict do nothing;

insert into public.shops (id, seller_profile_id, name)
values
  (
    '40000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'Seller One Shop'
  ),
  (
    '40000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000002',
    'Seller Two Shop'
  );

insert into public.products (
  id,
  shop_id,
  category_id,
  title,
  price,
  stock_quantity,
  is_active
)
values
  (
    '50000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    'In Stock Product',
    100,
    5,
    true
  ),
  (
    '50000000-0000-0000-0000-000000000002',
    '40000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000001',
    'Other Shop Product',
    150,
    5,
    true
  ),
  (
    '50000000-0000-0000-0000-000000000003',
    '40000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    'Low Stock Product',
    50,
    0,
    true
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select lives_ok(
  $$select public.place_direct_cod_order('50000000-0000-0000-0000-000000000001', 2)$$,
  'direct checkout creates an order'
);

reset role;

select is(
  (select stock_quantity from public.products where id = '50000000-0000-0000-0000-000000000001'),
  3,
  'direct checkout decrements stock'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select throws_ok(
  $$select public.place_direct_cod_order('50000000-0000-0000-0000-000000000003', 1)$$,
  'insufficient_stock',
  'out-of-stock direct checkout fails'
);

insert into public.cart_items (user_id, product_id, quantity)
values
  (
    '10000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000001',
    1
  ),
  (
    '10000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000002',
    1
  );

select lives_ok(
  $$select public.place_cart_cod_order()$$,
  'multi-shop cart checkout succeeds'
);

reset role;

select is(
  (
    select count(*)::integer
    from public.order_items
    where order_id in (
      select id
      from public.orders
      where checkout_source = 'cart'
    )
    and status = 'PENDING'
  ),
  2,
  'multi-shop checkout creates pending order items'
);

select is(
  (select count(*)::integer from public.cart_items where user_id = '10000000-0000-0000-0000-000000000001'),
  0,
  'cart checkout clears buyer cart'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is(
  (select count(*)::integer from public.cart_items),
  0,
  'buyer cannot see another buyer cart items'
);

select is(
  (select count(*)::integer from public.orders),
  0,
  'buyer cannot see another buyer orders'
);

reset role;

insert into public.orders (
  id,
  user_id,
  total_amount,
  payment_method,
  checkout_source
)
values (
  '60000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  250,
  'COD',
  'cart'
);

insert into public.order_items (order_id, product_id, quantity, price)
values
  (
    '60000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000001',
    1,
    100
  ),
  (
    '60000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000002',
    1,
    150
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select ok(
  exists (select 1 from public.order_items),
  'seller can see own shop order items'
);

select is(
  public.seller_can_update_order_item_status(
    (
      select id
      from public.order_items
      where order_id = '60000000-0000-0000-0000-000000000001'
      and product_id = '50000000-0000-0000-0000-000000000001'
    )
  ),
  true,
  'seller can update own item in multi-shop order'
);

select is(
  public.seller_can_update_order_item_status(
    (
      select id
      from public.order_items
      where order_id = '60000000-0000-0000-0000-000000000001'
      and product_id = '50000000-0000-0000-0000-000000000002'
    )
  ),
  false,
  'seller cannot update another seller item in multi-shop order'
);

select lives_ok(
  $$
    update public.order_items
    set status = 'CONFIRMED'
    where order_id = '60000000-0000-0000-0000-000000000001'
    and product_id = '50000000-0000-0000-0000-000000000001'
  $$,
  'seller can update own order item status'
);

reset role;

insert into public.orders (
  id,
  user_id,
  total_amount,
  payment_method,
  checkout_source
)
values (
  '60000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000001',
  100,
  'COD',
  'cart'
);

insert into public.order_items (order_id, product_id, quantity, price)
values (
  '60000000-0000-0000-0000-000000000002',
  '50000000-0000-0000-0000-000000000001',
  1,
  100
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is(
  public.seller_can_update_order_item_status(
    (
      select id
      from public.order_items
      where order_id = '60000000-0000-0000-0000-000000000002'
      and product_id = '50000000-0000-0000-0000-000000000001'
    )
  ),
  true,
  'seller can update single-shop own order item status'
);

select * from finish();

rollback;
