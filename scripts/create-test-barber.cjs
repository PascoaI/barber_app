#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function loadDotEnvFile(fileName) {
  const fullPath = path.join(process.cwd(), fileName);
  if (!fs.existsSync(fullPath)) return;
  const raw = fs.readFileSync(fullPath, 'utf8');
  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx <= 0) return;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  });
}

function env(key) {
  return String(process.env[key] || '').trim();
}

async function listAllAuthUsers(supabase) {
  const users = [];
  let page = 1;
  const perPage = 200;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const current = data?.users || [];
    users.push(...current);
    if (current.length < perPage) break;
    page += 1;
  }
  return users;
}

async function ensureAuthUser({ supabase, email, password, displayName }) {
  const all = await listAllAuthUsers(supabase);
  const existing = all.find((u) => String(u.email || '').toLowerCase() === email.toLowerCase());
  if (existing?.id) return existing.id;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: displayName }
  });
  if (error || !data?.user?.id) {
    throw error || new Error('auth_admin_create_user_failed');
  }
  return data.user.id;
}

async function main() {
  loadDotEnvFile('.env.local');
  loadDotEnvFile('.env');

  const url = env('NEXT_PUBLIC_SUPABASE_URL') || env('SUPABASE_URL');
  const serviceKey = env('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) {
    throw new Error('Variaveis ausentes: NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.');
  }

  const email = process.argv[2] || 'barber.teste@barber.com';
  const password = process.argv[3] || '123456';
  const name = process.argv[4] || 'Barbeiro Teste';

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  let barbershopId = process.argv[5] || '';
  if (!barbershopId) {
    const { data: firstShop, error: shopError } = await supabase
      .from('barbershops')
      .select('id,status,created_at')
      .in('status', ['active', 'trial'])
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (shopError) throw shopError;
    if (!firstShop?.id) throw new Error('Nenhuma barbearia ativa/trial encontrada para vincular o barbeiro.');
    barbershopId = String(firstShop.id);
  }

  const userId = await ensureAuthUser({
    supabase,
    email,
    password,
    displayName: name
  });

  const { error: profileError } = await supabase
    .from('users')
    .upsert({
      id: userId,
      barbershop_id: barbershopId,
      name,
      email,
      role: 'barber'
    }, { onConflict: 'id' });
  if (profileError) throw profileError;

  const { error: barberError } = await supabase
    .from('barbers')
    .upsert({
      id: userId,
      barbershop_id: barbershopId,
      name,
      phone: '',
      active: true
    }, { onConflict: 'id' });
  if (barberError) throw barberError;

  console.log('Barber de teste pronto.');
  console.log(`email: ${email}`);
  console.log(`senha: ${password}`);
  console.log(`barbershop_id: ${barbershopId}`);
  console.log(`user_id: ${userId}`);
}

main().catch((error) => {
  console.error('Falha ao criar barbeiro de teste:', error?.message || error);
  process.exit(1);
});
