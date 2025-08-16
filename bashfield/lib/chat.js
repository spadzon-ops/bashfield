// lib/chat.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Ensure a conversation exists for (me, otherUserId) on a listing and return its id
export async function ensureConversation({ listingId, otherUserId }) {
  if (!listingId || !otherUserId) throw new Error('Missing listingId or otherUserId');

  const { data: { user }, error: uErr } = await supabase.auth.getUser();
  if (uErr || !user) throw new Error('Not authenticated');

  const me = user.id;
  // normalize pair to match unique index logic
  const a = me < otherUserId ? me : otherUserId;
  const b = me < otherUserId ? otherUserId : me;

  const { data: existing, error: qErr } = await supabase
    .from('conversations')
    .select('id')
    .eq('listing_id', listingId)
    .or(
      `and(participant1.eq.${a},participant2.eq.${b}),and(participant1.eq.${b},participant2.eq.${a})`
    )
    .limit(1)
    .maybeSingle();

  if (qErr && qErr.code !== 'PGRST116') throw qErr;
  if (existing) return existing.id;

  const { data: created, error: iErr } = await supabase
    .from('conversations')
    .insert([{ listing_id: listingId, participant1: me, participant2: otherUserId }])
    .select('id')
    .single();

  if (iErr) throw iErr;
  return created.id;
}

// The function your page imports
export async function ensureConversationAndGo(router, { listingId, otherUserId }) {
  const id = await ensureConversation({ listingId, otherUserId });
  await router.replace(`/chat/${listingId}`); // route into your chat page
  return id;
}
