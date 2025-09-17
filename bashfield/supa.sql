-- Bashfield consolidated setup with Translation System, Verification, and Bio — SAFE to re-run
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
  is_verified boolean default false,
  bio text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add bio column if it doesn't exist
alter table public.user_profiles add column if not exists bio text default '';

-- Add verification column if it doesn't exist
alter table public.user_profiles add column if not exists is_verified boolean default false;

-- Add warning system columns (admin only)
alter table public.user_profiles add column if not exists warning_level text default 'none' check (warning_level in ('none', 'yellow', 'red'));
alter table public.user_profiles add column if not exists warning_reason text default '';

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
drop policy if exists "profiles_admin_update" on public.user_profiles;

create policy "profiles_read_all" on public.user_profiles
  for select using (true);

create policy "profiles_insert_self" on public.user_profiles
  for insert with check (auth.uid() = user_id);

create policy "profiles_update_self" on public.user_profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "profiles_delete_self" on public.user_profiles
  for delete using (auth.uid() = user_id);

create policy "profiles_admin_update" on public.user_profiles
  for update using ((auth.jwt() ->> 'email') in (select email from public.admin_emails))
  with check ((auth.jwt() ->> 'email') in (select email from public.admin_emails));

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
  insert into public.user_profiles(user_id, email, display_name, profile_picture, bio)
  values (
    new.id,
    coalesce(new.email, (new.raw_user_meta_data->>'email')),
    left(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name',
             split_part(coalesce(new.email, 'user@unknown'), '@', 1)), 20),
    new.raw_user_meta_data->>'avatar_url',
    ''
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

  listing_mode text default 'rent' check (listing_mode in ('rent', 'sale')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add columns if they don't exist
alter table public.listings add column if not exists is_active boolean default true;
alter table public.listings add column if not exists reference_code text;
alter table public.listings add column if not exists size_sqm integer;

alter table public.listings add column if not exists property_type text default 'apartment' check (property_type in ('apartment', 'house', 'villa', 'studio', 'office', 'shop', 'warehouse', 'land'));
alter table public.listings add column if not exists listing_mode text default 'rent' check (listing_mode in ('rent', 'sale'));
alter table public.listings add column if not exists has_installments boolean default false;

-- Add translation columns for admin manual translations
alter table public.listings add column if not exists title_en text;
alter table public.listings add column if not exists title_ku text;
alter table public.listings add column if not exists title_ar text;
alter table public.listings add column if not exists description_en text;
alter table public.listings add column if not exists description_ku text;
alter table public.listings add column if not exists description_ar text;

-- Update existing listings to have default property type and listing mode
update public.listings set property_type = 'apartment' where property_type is null;
update public.listings set listing_mode = 'rent' where listing_mode is null;

-- Make property_type and listing_mode not null
alter table public.listings alter column property_type set not null;
alter table public.listings alter column listing_mode set not null;

create index if not exists idx_listings_status  on public.listings(status);
create index if not exists idx_listings_user    on public.listings(user_id);
create index if not exists idx_listings_city    on public.listings(city);
create index if not exists idx_listings_created on public.listings(created_at desc);
create index if not exists idx_listings_active  on public.listings(is_active);

create index if not exists idx_listings_property_type on public.listings(property_type);
create index if not exists idx_listings_mode on public.listings(listing_mode);


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

create policy "conversations_select_admin" on public.conversations
  for select using ((auth.jwt() ->> 'email') in (select email from public.admin_emails));

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

create policy "messages_select_admin" on public.messages
  for select using ((auth.jwt() ->> 'email') in (select email from public.admin_emails));

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



-- ================= REPORTS =================
create table if not exists public.reports (
  id uuid default gen_random_uuid() primary key,
  listing_id uuid references public.listings(id) on delete cascade not null,
  reporter_id uuid references auth.users(id) on delete cascade not null,
  reason text not null,
  description text not null,
  status text default 'pending' check (status in ('pending', 'reviewed', 'resolved', 'dismissed')),
  admin_notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.reports enable row level security;

-- Drop existing policies
drop policy if exists "reports_select_admin" on public.reports;
drop policy if exists "reports_insert_authenticated" on public.reports;
drop policy if exists "reports_update_admin" on public.reports;

create policy "reports_select_admin" on public.reports
  for select using ((auth.jwt() ->> 'email') in (select email from public.admin_emails));

create policy "reports_insert_authenticated" on public.reports
  for insert with check (auth.uid() = reporter_id);

create policy "reports_update_admin" on public.reports
  for update using ((auth.jwt() ->> 'email') in (select email from public.admin_emails))
  with check ((auth.jwt() ->> 'email') in (select email from public.admin_emails));

create index if not exists idx_reports_listing on public.reports(listing_id);
create index if not exists idx_reports_status on public.reports(status);
create index if not exists idx_reports_created on public.reports(created_at desc);

-- ================= NOTIFICATIONS =================
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  message text not null,
  type text default 'info' check (type in ('info', 'success', 'warning', 'error', 'listing_approved', 'listing_rejected')),
  read boolean default false,
  listing_id uuid references public.listings(id) on delete cascade,
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;

-- Drop existing policies
drop policy if exists "notifications_select_own" on public.notifications;
drop policy if exists "notifications_insert_admin" on public.notifications;
drop policy if exists "notifications_update_own" on public.notifications;
drop policy if exists "notifications_delete_own" on public.notifications;

create policy "notifications_select_own" on public.notifications
  for select using (auth.uid() = user_id);

create policy "notifications_insert_admin" on public.notifications
  for insert with check ((auth.jwt() ->> 'email') in (select email from public.admin_emails));

create policy "notifications_update_own" on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "notifications_delete_own" on public.notifications
  for delete using (auth.uid() = user_id);

create index if not exists idx_notifications_user on public.notifications(user_id);
create index if not exists idx_notifications_read on public.notifications(user_id, read);
create index if not exists idx_notifications_created on public.notifications(created_at desc);

-- Function to create notification
create or replace function public.create_notification(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_type text default 'info',
  p_listing_id uuid default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  notification_id uuid;
begin
  insert into public.notifications (user_id, title, message, type, listing_id)
  values (p_user_id, p_title, p_message, p_type, p_listing_id)
  returning id into notification_id;
  
  return notification_id;
end;
$$;

-- Function to handle listing status changes
create or replace function public.handle_listing_status_change()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Only create notification if status actually changed and it's approval (not rejection to avoid duplicates)
  if OLD.status != NEW.status then
    if NEW.status = 'approved' then
      perform public.create_notification(
        NEW.user_id,
        'Property Approved! 🎉',
        'Great news! Your property "' || NEW.title || '" has been approved and is now live on Bashfield. Potential renters can now see and contact you about this property.',
        'listing_approved',
        NEW.id
      );
    -- Removed automatic rejection notification to prevent duplicates
    -- Admin will send manual rejection notifications
    end if;
  end if;
  
  return NEW;
end;
$$;

-- Create trigger for listing status changes
drop trigger if exists listing_status_notification_trigger on public.listings;
create trigger listing_status_notification_trigger
  after update on public.listings
  for each row
  execute function public.handle_listing_status_change();

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

  begin
    alter publication supabase_realtime add table public.notifications;
  exception
    when duplicate_object then null;
  end;
end
$pub$;