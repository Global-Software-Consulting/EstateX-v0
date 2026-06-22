-- =====================================================================
-- EstateX — Supabase setup (mirrors README schema + storage + signup trigger)
-- Run once in: Dashboard -> SQL Editor -> New query -> Run
-- The DROPs make this a clean reset — SAFE on a fresh project (no data yet).
-- Remove the DROP block if you ever re-run this on a project WITH data.
-- =====================================================================

-- ---- clean slate (fresh project) ----
drop table if exists public.saved_properties cascade;
drop table if exists public.inquiries        cascade;
drop table if exists public.property_images  cascade;
drop table if exists public.properties       cascade;
drop table if exists public.profiles         cascade;

-- ============================ TABLES (per README) ====================
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text,
  phone         text,
  role          text default 'user',
  created_at    timestamptz default now()
);

create table public.properties (
  id            uuid primary key default gen_random_uuid(),
  agent_id      uuid references public.profiles(id) on delete cascade,
  title         text not null,
  description   text,
  price         numeric not null,
  type          text not null,
  category      text not null,
  bedrooms      int not null,
  bathrooms     int not null,
  area_sqft     numeric not null,
  city          text not null,
  location      text,
  is_featured   boolean default false,
  status        text default 'active',
  created_at    timestamptz default now()
);

create table public.property_images (
  id            uuid primary key default gen_random_uuid(),
  property_id   uuid references public.properties(id) on delete cascade,
  storage_path  text not null,
  is_cover      boolean default false,
  created_at    timestamptz default now()
);

create table public.inquiries (
  id            uuid primary key default gen_random_uuid(),
  property_id   uuid references public.properties(id) on delete cascade,
  user_id       uuid references public.profiles(id) on delete cascade,
  agent_id      uuid references public.profiles(id) on delete cascade,
  inquiry_type  text not null check (inquiry_type in ('buy','rent','viewing')),
  message       text,
  phone         text,
  status        text default 'new' check (status in ('new','contacted','closed')),
  created_at    timestamptz default now()
);

create table public.saved_properties (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade,
  property_id   uuid references public.properties(id) on delete cascade,
  created_at    timestamptz default now(),
  unique (user_id, property_id)
);

-- ============================== RLS (per README) =====================
alter table public.profiles         enable row level security;
alter table public.properties       enable row level security;
alter table public.property_images  enable row level security;
alter table public.inquiries        enable row level security;
alter table public.saved_properties enable row level security;

create policy "Anyone can view profiles" on public.profiles for select using (true);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);

create policy "Anyone can view active properties" on public.properties for select using (status = 'active');
create policy "Agents can manage their own properties" on public.properties for all using (auth.uid() = agent_id);

create policy "Anyone can view property images" on public.property_images for select using (true);
create policy "Agents can manage their property images" on public.property_images for all using (
  auth.uid() = (select agent_id from public.properties where id = property_id)
);

create policy "Users can view their own inquiries" on public.inquiries for select using (auth.uid() = user_id or auth.uid() = agent_id);
create policy "Authenticated users can create inquiries" on public.inquiries for insert with check (auth.uid() = user_id);
create policy "Agents can update inquiry status" on public.inquiries for update using (auth.uid() = agent_id);

create policy "Users can view their saved" on public.saved_properties for select using (auth.uid() = user_id);
create policy "Users can save" on public.saved_properties for insert with check (auth.uid() = user_id);
create policy "Users can unsave" on public.saved_properties for delete using (auth.uid() = user_id);

-- ====== SIGNUP TRIGGER (not in README; safety net for profile creation) ======
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- ====== STORAGE (README says create the bucket; these object policies are required for uploads) ======
insert into storage.buckets (id, name, public)
values ('property-images', 'property-images', true)
on conflict (id) do nothing;

drop policy if exists pi_upload on storage.objects;
drop policy if exists pi_update on storage.objects;
drop policy if exists pi_delete on storage.objects;
create policy pi_upload on storage.objects for insert to authenticated with check (bucket_id = 'property-images');
create policy pi_update on storage.objects for update to authenticated using (bucket_id = 'property-images') with check (bucket_id = 'property-images');
create policy pi_delete on storage.objects for delete to authenticated using (bucket_id = 'property-images');
