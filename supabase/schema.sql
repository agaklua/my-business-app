-- HAGAKON HOTEL admin database
-- Run this once in the Supabase SQL Editor. Keep public sign-ups disabled.
create extension if not exists pgcrypto;

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  description text not null default '' check (char_length(description) <= 500),
  price numeric(10,2) check (price is null or price >= 0),
  capacity integer check (capacity is null or capacity between 1 and 30),
  size text not null default '',
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  storage_path text,
  alt_text text not null check (char_length(alt_text) between 1 and 160),
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.booking_enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) between 3 and 254),
  phone text not null default '' check (char_length(phone) <= 40),
  checkin date not null,
  checkout date not null,
  guests integer not null default 2 check (guests between 1 and 30),
  room_name text not null default 'Any room' check (char_length(room_name) <= 100),
  message text not null default '' check (char_length(message) <= 2000),
  status text not null default 'new' check (status in ('new','contacted','closed')),
  created_at timestamptz not null default now(),
  constraint valid_stay_dates check (checkout > checkin)
);

alter table public.rooms enable row level security;
alter table public.gallery_items enable row level security;
alter table public.booking_enquiries enable row level security;

drop policy if exists "Public can read active rooms" on public.rooms;
create policy "Public can read active rooms" on public.rooms for select to anon, authenticated using (active or auth.role() = 'authenticated');
drop policy if exists "Authenticated hotel admins manage rooms" on public.rooms;
create policy "Authenticated hotel admins manage rooms" on public.rooms for all to authenticated using (true) with check (true);

drop policy if exists "Public can read active gallery" on public.gallery_items;
create policy "Public can read active gallery" on public.gallery_items for select to anon, authenticated using (active or auth.role() = 'authenticated');
drop policy if exists "Authenticated hotel admins manage gallery" on public.gallery_items;
create policy "Authenticated hotel admins manage gallery" on public.gallery_items for all to authenticated using (true) with check (true);

drop policy if exists "Public may submit booking enquiries" on public.booking_enquiries;
create policy "Public may submit booking enquiries" on public.booking_enquiries for insert to anon, authenticated with check (
  status = 'new' and checkout > checkin and char_length(name) between 1 and 120
  and char_length(email) between 3 and 254 and char_length(message) <= 2000
);
drop policy if exists "Authenticated hotel admins read enquiries" on public.booking_enquiries;
create policy "Authenticated hotel admins read enquiries" on public.booking_enquiries for select to authenticated using (true);
drop policy if exists "Authenticated hotel admins update enquiries" on public.booking_enquiries;
create policy "Authenticated hotel admins update enquiries" on public.booking_enquiries for update to authenticated using (true) with check (status in ('new','contacted','closed'));
drop policy if exists "Authenticated hotel admins delete enquiries" on public.booking_enquiries;
create policy "Authenticated hotel admins delete enquiries" on public.booking_enquiries for delete to authenticated using (true);

grant select on public.rooms, public.gallery_items to anon;
grant select, insert, update, delete on public.rooms, public.gallery_items to authenticated;
grant insert on public.booking_enquiries to anon;
grant select, insert, update, delete on public.booking_enquiries to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('hotel-gallery','hotel-gallery',true,8388608,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=true, file_size_limit=8388608, allowed_mime_types=array['image/jpeg','image/png','image/webp'];

drop policy if exists "Public can view hotel gallery photos" on storage.objects;
create policy "Public can view hotel gallery photos" on storage.objects for select to anon, authenticated using (bucket_id='hotel-gallery');
drop policy if exists "Authenticated admins upload hotel gallery photos" on storage.objects;
create policy "Authenticated admins upload hotel gallery photos" on storage.objects for insert to authenticated with check (bucket_id='hotel-gallery');
drop policy if exists "Authenticated admins update hotel gallery photos" on storage.objects;
create policy "Authenticated admins update hotel gallery photos" on storage.objects for update to authenticated using (bucket_id='hotel-gallery') with check (bucket_id='hotel-gallery');
drop policy if exists "Authenticated admins delete hotel gallery photos" on storage.objects;
create policy "Authenticated admins delete hotel gallery photos" on storage.objects for delete to authenticated using (bucket_id='hotel-gallery');

insert into public.rooms(name, description, price, capacity, size, sort_order, active)
select 'Garden Room','A comfortable retreat with soft linens and the essentials for a restful stay.',null,null,'',0,true
where not exists (select 1 from public.rooms);
