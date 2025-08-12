// Helper utilities for starting or finding conversations (per listing)
import { supabase } from './supabase'

/**
 * Ensure there is a single conversation between me and otherId for a given listingId.
 * If listingId is null, this is a generic (non-listing) chat.
 * Returns the conversation id.
 */
export async function ensureConversation({ otherId, listingId = null }) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const meId = user.id
  const listFilter = listingId !== null
    ? `listing_id.eq.${listingId}`
    : 'listing_id.is.null'

  // look both directions (same listing id)
  const { data: found, error: selErr } = await supabase
    .from('conversations')
    .select('id')
    .or(
      `and(${listFilter},participant1.eq.${meId},participant2.eq.${otherId}),` +
      `and(${listFilter},participant1.eq.${otherId},participant2.eq.${meId})`
    )
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (selErr) throw selErr
  if (found?.id) return found.id

  // create conversation scoped to this listing
  const { data: created, error: insErr } = await supabase
    .from('conversations')
    .insert([{ listing_id: listingId, participant1: meId, participant2: otherId }])
    .select('id')
    .single()

  if (insErr) throw insErr
  return created.id
}
