
create table if not exists public.dnb_artists (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  spotify_id text,
  spotify_popularity int,
  spotify_followers bigint,
  youtube_channel_id text,
  youtube_subs bigint,
  ig_handle text,
  ig_followers bigint,
  last_release_at date,
  subgenres text[] not null default '{}',
  regions text[] not null default '{}',
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.dnb_artists enable row level security;

create policy "artists readable by authenticated"
  on public.dnb_artists for select to authenticated using (true);
