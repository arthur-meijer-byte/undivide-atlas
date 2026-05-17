import { createFileRoute } from '@tanstack/react-router';
import { supabaseAdmin } from '@/integrations/supabase/client.server';

const USERS = [
  {
    email: 'arthur@undivide.co.uk',
    display_name: 'Arthur',
    avatar_color: '#e84118',
    initial: 'A',
  },
  {
    email: 'james@undivide.co.uk',
    display_name: 'James',
    avatar_color: '#1a73e8',
    initial: 'J',
  },
];

async function seed() {
  const results: Array<{ email: string; status: string; id?: string }> = [];
  for (const u of USERS) {
    // check if exists
    const { data: list } = await supabaseAdmin.auth.admin.listUsers();
    const existing = list?.users.find((x) => x.email === u.email);
    if (existing) {
      // Ensure metadata + reset to temp password + force change
      await supabaseAdmin.auth.admin.updateUserById(existing.id, {
        password: 'Undivide2024!',
        email_confirm: true,
        user_metadata: {
          ...existing.user_metadata,
          display_name: u.display_name,
          avatar_color: u.avatar_color,
          initial: u.initial,
          role: 'idm',
        },
      });
      await supabaseAdmin
        .from('profiles')
        .upsert({
          id: existing.id,
          email: u.email,
          display_name: u.display_name,
          avatar_color: u.avatar_color,
          initial: u.initial,
          role: 'idm',
          must_change_password: true,
        });
      results.push({ email: u.email, status: 'updated', id: existing.id });
      continue;
    }
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: u.email,
      password: 'Undivide2024!',
      email_confirm: true,
      user_metadata: {
        display_name: u.display_name,
        avatar_color: u.avatar_color,
        initial: u.initial,
        role: 'idm',
        must_change_password: true,
      },
    });
    if (error) {
      results.push({ email: u.email, status: 'error: ' + error.message });
      continue;
    }
    results.push({ email: u.email, status: 'created', id: data.user?.id });
  }
  return results;
}

export const Route = createFileRoute('/api/public/seed-users')({
  server: {
    handlers: {
      GET: async () => {
        const r = await seed();
        return new Response(JSON.stringify({ ok: true, users: r }, null, 2), {
          headers: { 'Content-Type': 'application/json' },
        });
      },
      POST: async () => {
        const r = await seed();
        return new Response(JSON.stringify({ ok: true, users: r }, null, 2), {
          headers: { 'Content-Type': 'application/json' },
        });
      },
    },
  },
});
