-- Run this file in Supabase Dashboard > SQL Editor before using the app.
-- It provisions authentication profiles, synced Wayposts, likes, bookmarks, and photos.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Traveler',
  bio text,
  avatar_preset text,
  is_guest boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  title text,
  text text not null check (char_length(text) <= 220),
  category text not null,
  latitude double precision not null,
  longitude double precision not null,
  location_name text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  expiry_duration text not null check (expiry_duration in ('24h', '3d', '7d')),
  image_paths text[] not null default '{}',
  author_id uuid not null references public.profiles(id) on delete cascade,
  author_name text not null,
  author_avatar text,
  is_demo boolean not null default false,
  like_count integer not null default 0
);

create table if not exists public.reactions (
  note_id uuid not null references public.notes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (note_id, user_id)
);

create table if not exists public.bookmarks (
  note_id uuid not null references public.notes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (note_id, user_id)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.notes(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  reason text not null,
  comment text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, bio, avatar_preset, is_guest)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', 'Traveler'),
    new.raw_user_meta_data->>'bio',
    new.raw_user_meta_data->>'avatar_preset',
    coalesce((new.raw_user_meta_data->>'is_guest')::boolean, false)
  ) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.refresh_note_like_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.notes set like_count = (select count(*) from public.reactions where note_id = coalesce(new.note_id, old.note_id))
  where id = coalesce(new.note_id, old.note_id);
  return coalesce(new, old);
end;
$$;
drop trigger if exists on_reaction_changed on public.reactions;
create trigger on_reaction_changed after insert or delete on public.reactions
  for each row execute procedure public.refresh_note_like_count();

alter table public.profiles enable row level security;
alter table public.notes enable row level security;
alter table public.reactions enable row level security;
alter table public.bookmarks enable row level security;
alter table public.reports enable row level security;

create policy "profiles are readable" on public.profiles for select to authenticated using (true);
create policy "users update their profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "users insert their profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "notes are readable" on public.notes for select to authenticated using (true);
create policy "users create their notes" on public.notes for insert to authenticated with check (auth.uid() = author_id);
create policy "authors update notes" on public.notes for update to authenticated using (auth.uid() = author_id) with check (auth.uid() = author_id);
create policy "authors delete notes" on public.notes for delete to authenticated using (auth.uid() = author_id);
create policy "reactions are readable" on public.reactions for select to authenticated using (true);
create policy "users create reactions" on public.reactions for insert to authenticated with check (auth.uid() = user_id);
create policy "users delete reactions" on public.reactions for delete to authenticated using (auth.uid() = user_id);
create policy "users read their bookmarks" on public.bookmarks for select to authenticated using (auth.uid() = user_id);
create policy "users create bookmarks" on public.bookmarks for insert to authenticated with check (auth.uid() = user_id);
create policy "users delete bookmarks" on public.bookmarks for delete to authenticated using (auth.uid() = user_id);
create policy "users create reports" on public.reports for insert to authenticated with check (auth.uid() = user_id);
create policy "users read their reports" on public.reports for select to authenticated using (auth.uid() = user_id);

insert into storage.buckets (id, name, public) values ('waypost-images', 'waypost-images', true) on conflict (id) do update set public = true;
create policy "authenticated users upload their photos" on storage.objects for insert to authenticated with check (bucket_id = 'waypost-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "waypost photos are public" on storage.objects for select to public using (bucket_id = 'waypost-images');
create policy "users delete their photos" on storage.objects for delete to authenticated using (bucket_id = 'waypost-images' and (storage.foldername(name))[1] = auth.uid()::text);
