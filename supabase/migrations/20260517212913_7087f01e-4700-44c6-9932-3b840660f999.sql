
-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null,
  avatar_color text not null default '#888888',
  initial text not null default '?',
  role text not null default 'idm',
  must_change_password boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "profiles readable by authenticated"
  on public.profiles for select to authenticated using (true);
create policy "profiles update own"
  on public.profiles for update to authenticated using (auth.uid() = id);
create policy "profiles insert own"
  on public.profiles for insert to authenticated with check (auth.uid() = id);

-- handle new user
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name, avatar_color, initial, role, must_change_password)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)),
    coalesce(new.raw_user_meta_data->>'avatar_color', '#888888'),
    coalesce(new.raw_user_meta_data->>'initial', upper(left(new.email,1))),
    coalesce(new.raw_user_meta_data->>'role', 'idm'),
    coalesce((new.raw_user_meta_data->>'must_change_password')::boolean, false)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  message text not null,
  link_type text,
  link_id text,
  created_by uuid not null references auth.users(id) on delete cascade,
  for_user uuid not null references auth.users(id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;

create policy "notifications select own"
  on public.notifications for select to authenticated using (for_user = auth.uid());
create policy "notifications update own"
  on public.notifications for update to authenticated using (for_user = auth.uid());
create policy "notifications insert by authenticated"
  on public.notifications for insert to authenticated with check (created_by = auth.uid());

create index notifications_for_user_created_at on public.notifications (for_user, created_at desc);

alter publication supabase_realtime add table public.notifications;
alter table public.notifications replica identity full;
