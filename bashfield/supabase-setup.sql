-- Bashfield consolidated setup — SAFE to re-run
create extension if not exists pgcrypto;

-- ================= ADMIN =================
create table if not exists public.admin_emails(email text primary key);
insert into public.admin_emails(email) values ('spadzon@gmail.com')
on conflict (email) do nothing;

-- ================= PROFILES =================
create table if not exists public.user_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade unique,
  email text not null,
  display_name text not null,
  profile_picture text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.user_profiles enable row level security;

-- Drop any old/new policy names (idempotent)
drop policy if exists "Enable read access for all users" on public.user_profiles;
drop policy if exists "Enable insert for authenticated users only" on public.user_profiles;
drop policy if exists "Enable update for users based on user_id" on public.user_profiles;
drop policy if exists "Enable delete for users based on user_id" on public.user_profiles;

drop policy if exists "profiles_read_all" on public.user_profiles;
drop policy if exists "profiles_insert_self" on public.user_profiles;
drop policy if exists "profiles_update_self" on public.user_profiles;
drop policy if exists "profiles_delete_self" on public.user_profiles;

create policy "profiles_read_all" on public.user_profiles
  for select using (true);

create policy "profiles_insert_self" on public.user_profiles
  for insert with check (auth.uid() = user_id);

create policy "profiles_update_self" on public.user_profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "profiles_delete_self" on public.user_profiles
  for delete using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists user_profiles_set_updated_at on public.user_profiles;
create trigger user_profiles_set_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

-- Auto-create profile on new auth user
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.user_profiles(user_id, email, display_name, profile_picture)
  values (
    new.id,
    coalesce(new.email, (new.raw_user_meta_data->>'email')),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name',
             split_part(coalesce(new.email, 'user@unknown'), '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (user_id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users for each row execute procedure public.handle_new_user();

-- ================= STORAGE =================
insert into storage.buckets (id, name, public)
values ('house-images', 'house-images', true)
on conflict (id) do nothing;

-- Reset storage policies
drop policy if exists "house_images_read_public" on storage.objects;
drop policy if exists "house_images_insert_owner" on storage.objects;
drop policy if exists "house_images_update_owner" on storage.objects;
drop policy if exists "house_images_delete_owner" on storage.objects;

drop policy if exists "Anyone can view images" on storage.objects;
drop policy if exists "Authenticated users can upload images" on storage.objects;
drop policy if exists "Users can update their own images" on storage.objects;
drop policy if exists "Users can delete their own images" on storage.objects;

create policy "Anyone can view images" on storage.objects
  for select using (bucket_id = 'house-images');

create policy "Authenticated users can upload images" on storage.objects
  for insert with check (bucket_id = 'house-images' and auth.role() = 'authenticated');

create policy "Users can update their own images" on storage.objects
  for update using (bucket_id = 'house-images' and auth.role() = 'authenticated');

create policy "Users can delete their own images" on storage.objects
  for delete using (bucket_id = 'house-images' and auth.role() = 'authenticated');

-- ================= LISTINGS =================
create table if not exists public.listings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text not null,
  price integer not null,
  currency text default 'USD' check (currency in ('USD')),
  city text not null,
  rooms integer not null,
  phone text not null,
  latitude numeric(10,8),
  longitude numeric(11,8),
  images text[] default '{}'::text[],
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  is_active boolean default true,
  reference_code text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add columns if they don't exist
alter table public.listings add column if not exists is_active boolean default true;
alter table public.listings add column if not exists reference_code text;

create index if not exists idx_listings_status  on public.listings(status);
create index if not exists idx_listings_user    on public.listings(user_id);
create index if not exists idx_listings_city    on public.listings(city);
create index if not exists idx_listings_created on public.listings(created_at desc);
create index if not exists idx_listings_active  on public.listings(is_active);

-- Property code generator function
create or replace function public.gen_property_code()
returns text
language plpgsql
as $$
declare
  candidate text;
  tries int := 0;
begin
  loop
    candidate := 'BF-' || upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 6));
    perform 1 from public.listings where reference_code = candidate;
    if not found then
      return candidate;
    end if;
    tries := tries + 1;
    if tries > 20 then
      candidate := 'BF-' || upper(encode(gen_random_bytes(8), 'hex'));
      perform 1 from public.listings where reference_code = candidate;
      if not found then return candidate; end if;
    end if;
  end loop;
end;
$$;

-- Set default for reference_code and make it not null
update public.listings set reference_code = public.gen_property_code() where reference_code is null;
alter table public.listings alter column reference_code set default public.gen_property_code();
alter table public.listings alter column reference_code set not null;

alter table public.listings enable row level security;

drop policy if exists "Users can view approved listings" on public.listings;
drop policy if exists "Users can insert their own listings" on public.listings;
drop policy if exists "Users can view their own listings" on public.listings;
drop policy if exists "Admin can do everything" on public.listings;
drop policy if exists "Users can update their own listings" on public.listings;
drop policy if exists "Users can delete their own listings" on public.listings;

drop policy if exists "listings_select_approved" on public.listings;
drop policy if exists "listings_select_own" on public.listings;
drop policy if exists "listings_select_admin" on public.listings;
drop policy if exists "listings_insert_self" on public.listings;
drop policy if exists "listings_update_self" on public.listings;
drop policy if exists "listings_delete_self" on public.listings;
drop policy if exists "listings_admin_all" on public.listings;

create policy "listings_select_approved" on public.listings
  for select using (status = 'approved' and is_active = true);

create policy "listings_select_own" on public.listings
  for select using (auth.uid() = user_id);

create policy "listings_select_admin" on public.listings
  for select using ((auth.jwt() ->> 'email') in (select email from public.admin_emails));

create policy "listings_insert_self" on public.listings
  for insert with check (auth.uid() = user_id);

create policy "listings_update_self" on public.listings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "listings_delete_self" on public.listings
  for delete using (auth.uid() = user_id);

create policy "listings_admin_all" on public.listings
  for all using ((auth.jwt() ->> 'email') in (select email from public.admin_emails))
  with check ((auth.jwt() ->> 'email') in (select email from public.admin_emails));

drop trigger if exists listings_set_updated_at on public.listings;
create trigger listings_set_updated_at
before update on public.listings
for each row execute function public.set_updated_at();

-- ================= FAVORITES =================
create table if not exists public.favorites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  listing_id uuid references public.listings(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, listing_id)
);

alter table public.favorites enable row level security;

drop policy if exists "favorites_select_own" on public.favorites;
drop policy if exists "favorites_insert_own" on public.favorites;
drop policy if exists "favorites_delete_own" on public.favorites;

create policy "favorites_select_own" on public.favorites
  for select using (auth.uid() = user_id);

create policy "favorites_insert_own" on public.favorites
  for insert with check (auth.uid() = user_id);

create policy "favorites_delete_own" on public.favorites
  for delete using (auth.uid() = user_id);

create index if not exists idx_favorites_user on public.favorites(user_id);
create index if not exists idx_favorites_listing on public.favorites(listing_id);

-- ================= CHAT =================
create table if not exists public.conversations (
  id uuid default gen_random_uuid() primary key,
  listing_id uuid references public.listings(id) on delete cascade,
  participant1 uuid references auth.users(id) on delete cascade,
  participant2 uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(listing_id, participant1, participant2)
);

create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete cascade,
  recipient_id uuid references auth.users(id) on delete cascade,
  content text not null,
  read boolean default false,
  created_at timestamptz default now()
);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create unique index if not exists uniq_convo_pair
on public.conversations (
  listing_id,
  least(participant1, participant2),
  greatest(participant1, participant2)
);

-- Policies
drop policy if exists "conversations_select_own" on public.conversations;
drop policy if exists "conversations_insert_own" on public.conversations;
drop policy if exists "conversations_update_participants" on public.conversations;
drop policy if exists "conversations_delete_own" on public.conversations;

drop policy if exists "messages_select_own_convos" on public.messages;
drop policy if exists "messages_insert_sender" on public.messages;
drop policy if exists "messages_update_recipient" on public.messages;

create policy "conversations_select_own" on public.conversations
  for select using (auth.uid() = participant1 or auth.uid() = participant2);

create policy "conversations_insert_own" on public.conversations
  for insert with check (auth.uid() = participant1 or auth.uid() = participant2);

create policy "conversations_update_participants" on public.conversations
  for update using (auth.uid() = participant1 or auth.uid() = participant2)
  with check (auth.uid() = participant1 or auth.uid() = participant2);

create policy "conversations_delete_own" on public.conversations
  for delete using (auth.uid() = participant1 or auth.uid() = participant2);

create index if not exists idx_messages_conversation   on public.messages(conversation_id);
create index if not exists idx_messages_recipient_read on public.messages(recipient_id, read);
create index if not exists idx_messages_convo_created  on public.messages(conversation_id, created_at desc);

create policy "messages_select_own_convos" on public.messages
  for select using (auth.uid() = sender_id or auth.uid() = recipient_id);

create policy "messages_insert_sender" on public.messages
  for insert with check (auth.uid() = sender_id);

create policy "messages_update_recipient" on public.messages
  for update using (auth.uid() = recipient_id);

create or replace function public.update_conversation_timestamp()
returns trigger language plpgsql as $$
begin
  update public.conversations set updated_at = now() where id = new.conversation_id;
  return new;
end $$;

drop trigger if exists update_conversation_timestamp_trigger on public.messages;
create trigger update_conversation_timestamp_trigger
after insert on public.messages
for each row execute function public.update_conversation_timestamp();

-- ================= REALTIME =================
do $pub$
begin
  begin
    alter publication supabase_realtime add table public.messages;
  exception
    when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.conversations;
  exception
    when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.favorites;
  exception
    when duplicate_object then null;
  end;
end
$pub$;