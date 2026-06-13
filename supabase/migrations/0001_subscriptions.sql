-- Run this once in the Supabase SQL editor for your project.
-- Tracks subscription status per parent account. A missing row means
-- the user is on the free tier (no row is created at signup).

create table public.subscriptions (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id   text unique,
  stripe_subscription_id text unique,
  status               text not null default 'free',
  price_id             text,
  current_period_end   timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- status values: 'free' | 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete'

alter table public.subscriptions enable row level security;

-- Users can read their own subscription row. All writes happen via the
-- stripe-webhook Netlify function using the service-role key, which
-- bypasses RLS entirely — no insert/update/delete policy is needed.
create policy "Users can view their own subscription"
  on public.subscriptions
  for select
  using (auth.uid() = user_id);

create function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row
  execute function public.set_updated_at();
