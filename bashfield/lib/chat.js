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
        `and(listing_id.eq.${listingId},participant1.eq.${otherId},participant2.eq.${user.id_
