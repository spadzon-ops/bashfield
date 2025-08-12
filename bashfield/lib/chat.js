// Helper utilities for starting or finding conversations
import { supabase } from './supabase'

/**
 * Ensure there is a single conversation between me and otherId for the given listingId (or null).
 * Returns the conversation id.
 */
export async function ensureConversation({ otherId, listingId = null }) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const meId = user.id
  const listFilter = listingId
    ? `listing_id.eq.${listingId}`
    : 'listing_id.is.null'

  // look both directions
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

  // create conversation
  const { data: created, error: insErr } = await supabase
    .from('conversations')
    .insert([{ listing_id: listingId || null, participant1: meId, participant2: otherId }])
    .select('id')
    .single()

  if (insErr) throw insErr
  return created.id
}

/**
 * Ensure conversation and navigate to /messages?id=<conversationId>
 */
export async function ensureConversationAndGo({ router, otherId, listingId = null }) {
  const id = await ensureConversation({ otherId, listingId })
  // Use replace so the peer/listing params don't linger
  await router.replace(`/messages?id=${id}`)
  return id
}
