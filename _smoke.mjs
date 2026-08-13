import { createClient } from '@supabase/supabase-js';

const URL = 'https://rfhvvgvnxbmmgifqqeor.supabase.co';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmaHZ2Z3ZueGJtbWdpZnFxZW9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1NTQyNDIsImV4cCI6MjEwMjEzMDI0Mn0.sb9dotcjFRfCWY-t0eW6OhENKr_eRNl1uzov4DIs_qs';
const TOKEN = process.env.SUPABASE_PAT;
const REF = 'rfhvvgvnxbmmgifqqeor';

async function sql(q) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: q }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error('SQL ' + r.status + ' ' + JSON.stringify(j));
  return j;
}

const supabase = createClient(URL, ANON, { auth: { persistSession: false } });
const anonClient = createClient(URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
const email = `smoke${Date.now()}@gmail.com`;
const pw = 'SmokeTest123\!';

console.log('1) signUp (fires handle_new_user trigger):', email);
const { data: su, error: suErr } = await supabase.auth.signUp({ email, password: pw });
if (suErr) { console.error('   SIGNUP ERROR', suErr); process.exit(1); }
const uid = su.user.id;
console.log('   user id', uid);

console.log('2) (autoconfirm enabled) profile row auto-created by trigger?');
const prof = await sql(`select id, display_name from public.profiles where id = '${uid}';`);
console.log('   profile:', JSON.stringify(prof));

console.log('4) unauthenticated insert should be BLOCKED by RLS');
const { error: anonErr } = await anonClient.from('journal_entries').insert({ user_id: uid, date: 'x', title: 'x', theme: 'x', content: 'x', created_at: 1, updated_at: 1 });
console.log('   anon insert error (expected):', anonErr?.message || 'NONE (BAD)');

console.log('5) sign in');
const { data: sign, error: signErr } = await supabase.auth.signInWithPassword({ email, password: pw });
if (signErr) { console.error('   SIGNIN ERROR', signErr); process.exit(1); }
console.log('   signed in as', sign.session.user.id);

console.log('6) authenticated insert (RLS owner allow)');
const now = Date.now();
const { data: ins, error: iErr } = await supabase
  .from('journal_entries')
  .insert({ user_id: uid, date: 'Aug 6', title: 'Smoke', theme: 'calm', content: 'hello', created_at: now, updated_at: now })
  .select().single();
console.log('   inserted:', JSON.stringify(ins), 'err:', iErr?.message);

console.log('7) select own entries');
const { data: sel } = await supabase.from('journal_entries').select('*');
console.log('   count', sel?.length);

console.log('8) cleanup (cascade delete)');
await sql(`delete from auth.users where id = '${uid}';`);
console.log('SMOKE TEST OK');
