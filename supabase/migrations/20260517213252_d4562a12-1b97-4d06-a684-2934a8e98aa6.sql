
create extension if not exists pgcrypto;

do $$
declare
  arthur_id uuid;
  james_id  uuid;
begin
  -- Arthur
  select id into arthur_id from auth.users where email = 'arthur@undivide.co.uk';
  if arthur_id is null then
    arthur_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', arthur_id, 'authenticated', 'authenticated',
      'arthur@undivide.co.uk', crypt('Undivide2024!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"display_name":"Arthur","avatar_color":"#e84118","initial":"A","role":"idm","must_change_password":true}'::jsonb,
      now(), now(), '', '', '', ''
    );
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at, last_sign_in_at)
    values (gen_random_uuid(), arthur_id,
      jsonb_build_object('sub', arthur_id::text, 'email', 'arthur@undivide.co.uk', 'email_verified', true),
      'email', arthur_id::text, now(), now(), now());
  else
    update auth.users
      set encrypted_password = crypt('Undivide2024!', gen_salt('bf')),
          email_confirmed_at = coalesce(email_confirmed_at, now()),
          raw_user_meta_data = raw_user_meta_data
            || '{"display_name":"Arthur","avatar_color":"#e84118","initial":"A","role":"idm","must_change_password":true}'::jsonb,
          updated_at = now()
      where id = arthur_id;
  end if;

  insert into public.profiles (id, email, display_name, avatar_color, initial, role, must_change_password)
  values (arthur_id, 'arthur@undivide.co.uk', 'Arthur', '#e84118', 'A', 'idm', true)
  on conflict (id) do update set
    display_name = excluded.display_name,
    avatar_color = excluded.avatar_color,
    initial = excluded.initial,
    role = excluded.role,
    must_change_password = true;

  -- James
  select id into james_id from auth.users where email = 'james@undivide.co.uk';
  if james_id is null then
    james_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', james_id, 'authenticated', 'authenticated',
      'james@undivide.co.uk', crypt('Undivide2024!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"display_name":"James","avatar_color":"#1a73e8","initial":"J","role":"idm","must_change_password":true}'::jsonb,
      now(), now(), '', '', '', ''
    );
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at, last_sign_in_at)
    values (gen_random_uuid(), james_id,
      jsonb_build_object('sub', james_id::text, 'email', 'james@undivide.co.uk', 'email_verified', true),
      'email', james_id::text, now(), now(), now());
  else
    update auth.users
      set encrypted_password = crypt('Undivide2024!', gen_salt('bf')),
          email_confirmed_at = coalesce(email_confirmed_at, now()),
          raw_user_meta_data = raw_user_meta_data
            || '{"display_name":"James","avatar_color":"#1a73e8","initial":"J","role":"idm","must_change_password":true}'::jsonb,
          updated_at = now()
      where id = james_id;
  end if;

  insert into public.profiles (id, email, display_name, avatar_color, initial, role, must_change_password)
  values (james_id, 'james@undivide.co.uk', 'James', '#1a73e8', 'J', 'idm', true)
  on conflict (id) do update set
    display_name = excluded.display_name,
    avatar_color = excluded.avatar_color,
    initial = excluded.initial,
    role = excluded.role,
    must_change_password = true;
end $$;
