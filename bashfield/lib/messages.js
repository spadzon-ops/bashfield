export async function fetchUnreadCountsByConversation(supabase) {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return {}

  const { data, error } = await supabase
    .from('messages')
    .select('conversation_id')
    .eq('recipient_id', userData.user.id)
    .eq('read', false)

  if (error) throw error

  const map = {}
  data.forEach(({ conversation_id }) => {
    map[conversation_id] = (map[conversation_id] || 0) + 1
  })
  return map
}

export async function markConversationRead(supabase, conversationId) {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return

  const { error } = await supabase
    .from('messages')
    .update({ read: true })
    .eq('conversation_id', conversationId)
    .eq('recipient_id', userData.user.id)
    .eq('read', false)

  if (error) throw error
}