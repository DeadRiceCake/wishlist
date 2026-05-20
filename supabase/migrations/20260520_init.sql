create extension if not exists "pgcrypto";

create type wish_visibility as enum ('PRIVATE', 'COUPLE');
create type wish_status as enum ('WANT', 'PLANNED', 'DONE', 'ARCHIVED');
create type invite_status as enum ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELED');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 30),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.couples (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create table public.couple_members (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  unique (couple_id, user_id)
);

create index idx_couple_members_user on public.couple_members(user_id);
create index idx_couple_members_couple on public.couple_members(couple_id);

create table public.couple_invites (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  inviter_id uuid not null references public.profiles(id) on delete cascade,
  token text not null unique,
  status invite_status not null default 'PENDING',
  expires_at timestamptz not null,
  accepted_by uuid references public.profiles(id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_invites_token on public.couple_invites(token);

create table public.wishes (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  memo text not null default '',
  visibility wish_visibility not null default 'COUPLE',
  status wish_status not null default 'WANT',
  priority smallint not null default 2 check (priority between 1 and 3),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_wishes_couple_updated on public.wishes(couple_id, updated_at desc);
create index idx_wishes_owner_status on public.wishes(owner_id, status);

create table public.wish_reservations (
  id uuid primary key default gen_random_uuid(),
  wish_id uuid not null unique references public.wishes(id) on delete cascade,
  reserved_by uuid not null references public.profiles(id) on delete cascade,
  note text not null default '',
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_notifications_user_created on public.notifications(user_id, created_at desc);

create table public.device_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.couples enable row level security;
alter table public.couple_members enable row level security;
alter table public.couple_invites enable row level security;
alter table public.wishes enable row level security;
alter table public.wish_reservations enable row level security;
alter table public.notifications enable row level security;
alter table public.device_subscriptions enable row level security;

create policy "profiles_select_self_or_partner" on public.profiles
for select using (
  auth.uid() = id
  or exists (
    select 1
    from public.couple_members me
    join public.couple_members partner on me.couple_id = partner.couple_id
    where me.user_id = auth.uid()
      and partner.user_id = profiles.id
      and me.left_at is null
      and partner.left_at is null
  )
);

create policy "profiles_update_self" on public.profiles
for update using (auth.uid() = id)
with check (auth.uid() = id);

create policy "couples_select_member" on public.couples
for select using (
  exists (
    select 1 from public.couple_members cm
    where cm.couple_id = couples.id
      and cm.user_id = auth.uid()
      and cm.left_at is null
  )
);

create policy "wishes_select_owner_or_shared" on public.wishes
for select using (
  owner_id = auth.uid()
  or (
    visibility = 'COUPLE'
    and exists (
      select 1 from public.couple_members cm
      where cm.couple_id = wishes.couple_id
        and cm.user_id = auth.uid()
        and cm.left_at is null
    )
  )
);

create policy "wishes_insert_owner" on public.wishes
for insert with check (owner_id = auth.uid());

create policy "wishes_update_owner" on public.wishes
for update using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "wishes_delete_owner" on public.wishes
for delete using (owner_id = auth.uid());

create policy "notifications_own_all" on public.notifications
for all using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "device_subscriptions_own_all" on public.device_subscriptions
for all using (user_id = auth.uid())
with check (user_id = auth.uid());
