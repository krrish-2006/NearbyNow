create table if not exists seller_ai_credits (
  seller_profile_id uuid primary key references profiles(id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  lifetime_purchased integer not null default 0 check (lifetime_purchased >= 0),
  lifetime_used integer not null default 0 check (lifetime_used >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists ai_credit_purchases (
  id uuid primary key default gen_random_uuid(),
  seller_profile_id uuid not null references profiles(id) on delete cascade,
  pack_id text not null,
  credits integer not null check (credits > 0),
  amount_paise integer not null check (amount_paise > 0),
  currency text not null default 'INR',
  provider text not null default 'razorpay',
  provider_order_id text unique,
  provider_payment_id text,
  status text not null default 'created',
  credited_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_credit_purchases_status_check
    check (status in ('created', 'paid', 'failed', 'cancelled'))
);

create table if not exists ai_enhancement_jobs (
  id uuid primary key default gen_random_uuid(),
  seller_profile_id uuid not null references profiles(id) on delete cascade,
  shop_id uuid references shops(id) on delete set null,
  provider text not null default 'useknockout',
  status text not null default 'reserved',
  cost_credits integer not null default 1 check (cost_credits > 0),
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  refunded_at timestamptz,
  constraint ai_enhancement_jobs_status_check
    check (status in ('reserved', 'completed', 'failed', 'refunded'))
);

create table if not exists payment_webhook_events (
  id text primary key,
  provider text not null default 'razorpay',
  event_type text not null,
  processed_at timestamptz not null default now()
);

alter table seller_ai_credits enable row level security;
alter table ai_credit_purchases enable row level security;
alter table ai_enhancement_jobs enable row level security;
alter table payment_webhook_events enable row level security;

drop policy if exists "Sellers can view own AI credit balance" on seller_ai_credits;
create policy "Sellers can view own AI credit balance"
on seller_ai_credits
for select
to authenticated
using (seller_profile_id = auth.uid());

drop policy if exists "Sellers can view own AI credit purchases" on ai_credit_purchases;
create policy "Sellers can view own AI credit purchases"
on ai_credit_purchases
for select
to authenticated
using (seller_profile_id = auth.uid());

drop policy if exists "Sellers can view own AI enhancement jobs" on ai_enhancement_jobs;
create policy "Sellers can view own AI enhancement jobs"
on ai_enhancement_jobs
for select
to authenticated
using (seller_profile_id = auth.uid());

create or replace function get_seller_ai_credit_balance()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
begin
  if auth.uid() is null then
    raise exception 'auth_required';
  end if;

  insert into seller_ai_credits (seller_profile_id)
  values (auth.uid())
  on conflict (seller_profile_id) do nothing;

  select balance
  into v_balance
  from seller_ai_credits
  where seller_profile_id = auth.uid();

  return coalesce(v_balance, 0);
end;
$$;

create or replace function reserve_ai_enhancement_credit(p_shop_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job_id uuid;
begin
  if auth.uid() is null then
    raise exception 'auth_required';
  end if;

  if not exists (
    select 1
    from shops
    where id = p_shop_id
      and seller_profile_id = auth.uid()
  ) then
    raise exception 'seller_shop_not_found';
  end if;

  insert into seller_ai_credits (seller_profile_id)
  values (auth.uid())
  on conflict (seller_profile_id) do nothing;

  update seller_ai_credits
  set
    balance = balance - 1,
    lifetime_used = lifetime_used + 1,
    updated_at = now()
  where seller_profile_id = auth.uid()
    and balance >= 1;

  if not found then
    raise exception 'insufficient_ai_credits';
  end if;

  insert into ai_enhancement_jobs (
    seller_profile_id,
    shop_id,
    status,
    cost_credits
  )
  values (
    auth.uid(),
    p_shop_id,
    'reserved',
    1
  )
  returning id into v_job_id;

  return v_job_id;
end;
$$;

create or replace function complete_ai_enhancement_job(p_job_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'auth_required';
  end if;

  update ai_enhancement_jobs
  set
    status = 'completed',
    completed_at = now()
  where id = p_job_id
    and seller_profile_id = auth.uid()
    and status = 'reserved';
end;
$$;

create or replace function refund_ai_enhancement_credit(
  p_job_id uuid,
  p_error_message text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seller_profile_id uuid;
  v_cost_credits integer;
begin
  if auth.uid() is null then
    raise exception 'auth_required';
  end if;

  update ai_enhancement_jobs
  set
    status = 'refunded',
    error_message = p_error_message,
    refunded_at = now()
  where id = p_job_id
    and seller_profile_id = auth.uid()
    and status = 'reserved'
  returning seller_profile_id, cost_credits
  into v_seller_profile_id, v_cost_credits;

  if found then
    update seller_ai_credits
    set
      balance = balance + v_cost_credits,
      lifetime_used = greatest(lifetime_used - v_cost_credits, 0),
      updated_at = now()
    where seller_profile_id = v_seller_profile_id;
  end if;
end;
$$;

create or replace function grant_ai_credits_for_paid_purchase(
  p_purchase_id uuid,
  p_provider_payment_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_purchase ai_credit_purchases%rowtype;
begin
  select *
  into v_purchase
  from ai_credit_purchases
  where id = p_purchase_id
  for update;

  if not found then
    raise exception 'purchase_not_found';
  end if;

  if v_purchase.status = 'paid' then
    return;
  end if;

  update ai_credit_purchases
  set
    status = 'paid',
    provider_payment_id = p_provider_payment_id,
    credited_at = now(),
    updated_at = now()
  where id = p_purchase_id;

  insert into seller_ai_credits (
    seller_profile_id,
    balance,
    lifetime_purchased,
    updated_at
  )
  values (
    v_purchase.seller_profile_id,
    v_purchase.credits,
    v_purchase.credits,
    now()
  )
  on conflict (seller_profile_id) do update
  set
    balance = seller_ai_credits.balance + excluded.balance,
    lifetime_purchased =
      seller_ai_credits.lifetime_purchased + excluded.lifetime_purchased,
    updated_at = now();
end;
$$;

grant execute on function get_seller_ai_credit_balance() to authenticated;
grant execute on function reserve_ai_enhancement_credit(uuid) to authenticated;
grant execute on function complete_ai_enhancement_job(uuid) to authenticated;
grant execute on function refund_ai_enhancement_credit(uuid, text) to authenticated;
grant execute on function grant_ai_credits_for_paid_purchase(uuid, text) to service_role;
