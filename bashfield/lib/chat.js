// Central helper to guarantee we open/create the right conversation.
// Usage: ensureConversation({ otherId, listingId })
import { supabase } from './supabase'

/**
 * Ensures (and returns) a conversation id. Property-first:
 * - If listingId is provided -> use (listing_id + two participants).
 * - Else -> fallback to 1:1 non-listing conversation (listing_id IS NULL).
 * Returns the conversation id (string).
 */
export async function ensureConversation({ otherId, listingId = null }) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  if (!otherId) throw new Error('Missing otherId')
  if (otherId === user.id) throw new Error('Cannot message yourself')

  // Property-scoped conversation
  if (listingId) {
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(
        `and(listing_id.eq.${listingId},participant1.eq.${user.id},participant2.eq.${otherId}),` +
        `and(listing_id.eq.${listingId},participant1.eq.${otherId},participant2.eq.${user.id})`
      )
      .maybeSingle()

    if (existing?.id) return existing.id

    const { data: created, error } = await supabase
      .from('conversations')
      .insert({
        listing_id: listingId,
        participant1: user.id,
        participant2: otherId,
      })
      .select('id')
      .single()

    if (error) throw error
    return created.id
  }

  // Non-listing (general) conversation as fallback
  const { data: existingGeneral } = await supabase
    .from('conversations')
    .select('id')
    .or(
      `and(listing_id.is.null,participant1.eq.${user.id},participant2.eq.${otherId}),` +
      `and(listing_id.is.null,participant1.eq.${otherId},participant2.eq.${user.id})`
    )
    .maybeSingle()

  if (existingGeneral?.id) return existingGeneral.id

  const { data: createdGeneral, error: err2 } = await supabase
    .from('conversations')
    .insert({
      listing_id: null,
      participant1: user.id,
      participant2: otherId,
    })
    .select('id')
    .single()

  if (err2) throw err2
  return createdGeneral.id
}
