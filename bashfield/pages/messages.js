import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import { supabase } from '../lib/supabase'

export default function Messages() {
  const { t } = useTranslation('common')
  const router = useRouter()

  const [user, setUser] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [conversations, setConversations] = useState([])
  const [activeConversation, setActiveConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)

  // scrolling control (fix #2)
  const messagesContainerRef = useRef(null)
  const messagesEndRef = useRef(null)
  const autoScrollRef = useRef(true) // only true when user is near bottom or just switched convo

  const isNearBottom = () => {
    const el = messagesContainerRef.current
    if (!el) return true
    const threshold = 80 // px
    return el.scrollHeight - el.scrollTop - el.clientHeight < threshold
  }
  const handleScroll = () => {
    autoScrollRef.current = isNearBottom()
  }
  const scrollToBottom = () => {
    const el = messagesContainerRef.current
    if (el) el.scrollTop = el.scrollHeight
  }

  // -----------------------------------------
  // Auth + initial load
  // -----------------------------------------
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const {
      data: { user: u },
    } = await supabase.auth.getUser()
    if (!u) {
      router.push('/')
      return
    }
    setUser(u)
    setCurrentUser(u)
    await fetchConversations(u)
    setLoading(false)
  }

  // open conversation from query string if present
  useEffect(() => {
    if (!router.isReady || conversations.length === 0) return
    const idFromQuery =
      router.query.id || new URLSearchParams(window.location.search).get('id')
    if (idFromQuery) {
      const c = conversations.find((x) => x.id === idFromQuery)
      if (c) selectConversation(c)
    }
  }, [router.isReady, conversations])

  // clear active conversation when leaving page (fix #1)
  useEffect(() => {
    const handleRouteChange = () => {
      window.activeConversationId = null
      window.dispatchEvent(
        new CustomEvent('activeConversationChanged', { detail: { id: null } })
      )
    }
    router.events.on('routeChangeStart', handleRouteChange)
    return () => router.events.off('routeChangeStart', handleRouteChange)
  }, [router.events])

  // -----------------------------------------
  // Conversations list
  // -----------------------------------------
  const fetchConversations = async (u = user) => {
    if (!u) return

    const { data: convData, error } = await supabase
      .from('conversations')
      .select('*')
      .or(`participant1.eq.${u.id},participant2.eq.${u.id}`)
      .order('updated_at', { ascending: false })
    if (error || !convData) return

    const participantIds = [
      ...new Set(convData.flatMap((c) => [c.participant1, c.participant2])),
    ]
    const listingIds = [
      ...new Set(convData.map((c) => c.listing_id).filter(Boolean)),
    ]

    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, profile_picture')
      .in('user_id', participantIds)

    const { data: listings } = listingIds.length
      ? await supabase.from('listings').select('id, title').in('id', listingIds)
      : { data: [] }

    const { data: lastMsgs } = convData.length
      ? await supabase
          .from('messages')
          .select('conversation_id, content, created_at, sender_id')
          .in(
            'conversation_id',
            convData.map((c) => c.id)
          )
          .order('created_at', { ascending: false })
      : { data: [] }

    const { data: unread } = convData.length
      ? await supabase
          .from('messages')
          .select('conversation_id, id')
          .in(
            'conversation_id',
            convData.map((c) => c.id)
          )
          .eq('recipient_id', u.id)
          .eq('read', false)
      : { data: [] }

    const processed = convData
      .map((conv) => {
        const otherId =
          conv.participant1 === u.id ? conv.participant2 : conv.participant1
        const other = profiles?.find((p) => p.user_id === otherId) || null
        const listing = listings?.find((l) => l.id === conv.listing_id) || null
        const last = lastMsgs?.find((m) => m.conversation_id === conv.id) || null

        let unreadCount =
          unread?.filter((m) => m.conversation_id === conv.id).length || 0

        // fix #1: never show unread on the open conversation in Section 2
        if (window.activeConversationId && conv.id === window.activeConversationId) {
          unreadCount = 0
        }

        return {
          ...conv,
          other_participant: other,
          listing,
          last_message: last,
          unread_count: unreadCount,
        }
      })
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))

    setConversations(processed)
  }

  // global realtime: keep Section 2 fresh and mute Section 1 for open convo (fix #1 & #3)
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel(`global-messages-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const m = payload.new
          if (m.recipient_id === user.id || m.sender_id === user.id) {
            // always refresh conversations (fix #3: this moves the convo to top)
            fetchConversations(user)

            // mute Section 1 badge only if the open conversation receives a message
            if (
              window.activeConversationId &&
              m.conversation_id === window.activeConversationId
            ) {
              // no global unread updates for the open conversation
              return
            }
            // otherwise update global unread count (Layout listens to this)
            window.dispatchEvent(new CustomEvent('messagesRead'))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  // -----------------------------------------
  // Open/select a conversation
  // -----------------------------------------
  const selectConversation = async (conv) => {
    setActiveConversation(conv)

    // set global lock so Section 1/2 don't notify (fix #1)
    window.activeConversationId = conv.id
    window.dispatchEvent(
      new CustomEvent('activeConversationChanged', { detail: { id: conv.id } })
    )

    await fetchMessages(conv.id)
    await markAsRead(conv.id)

    // zero unread locally for this conversation
    setConversations((prev) =>
      prev.map((c) => (c.id === conv.id ? { ...c, unread_count: 0 } : c))
    )

    // autoscroll on open
    autoScrollRef.current = true
    requestAnimationFrame(scrollToBottom)
  }

  // -----------------------------------------
  // Messages for the active conversation
  // -----------------------------------------
  const attachSenderProfile = async (msg) => {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('display_name, profile_picture')
      .eq('user_id', msg.sender_id)
      .single()
    return { ...msg, sender: profile || { display_name: 'Unknown User' } }
  }

  const fetchMessages = async (conversationId = activeConversation?.id) => {
    if (!conversationId) return
    const { data: msgs, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
    if (error || !msgs) return

    const senderIds = [...new Set(msgs.map((m) => m.sender_id))]
    const { data: profiles } = senderIds.length
      ? await supabase
          .from('user_profiles')
          .select('user_id, display_name, profile_picture')
          .in('user_id', senderIds)
      : { data: [] }

    const merged = msgs.map((m) => ({
      ...m,
      sender:
        profiles?.find((p) => p.user_id === m.sender_id) || {
          display_name: 'Unknown User',
        },
    }))

    setMessages(merged)
  }

  // realtime for the currently open conversation
  useEffect(() => {
    if (!activeConversation || !user) return

    const ch = supabase
      .channel(`conversation-${activeConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeConversation.id}`,
        },
        async (payload) => {
          const m = payload.new

          // append if not duplicate
          setMessages((prev) => {
            if (prev.find((x) => x.id === m.id)) return prev
            return prev
          })

          // attach sender profile
          const withProfile = await attachSenderProfile(m)
          setMessages((prev) => [...prev, withProfile])

          // keep this conversation on top in Section 2 (fix #3)
          setConversations((prev) => {
            const updated = prev.map((c) =>
              c.id === activeConversation.id
                ? {
                    ...c,
                    updated_at: new Date().toISOString(),
                    last_message: {
                      content: m.content,
                      sender_id: m.sender_id,
                      created_at: m.created_at,
                    },
                  }
                : c
            )
            return updated.sort(
              (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
            )
          })

          // if recipient is me and chat is open => mark as read & mute badges (fix #1)
          if (
            m.recipient_id === user.id &&
            window.activeConversationId === m.conversation_id
          ) {
            await supabase.from('messages').update({ read: true }).eq('id', m.id)
            window.dispatchEvent(new CustomEvent('messagesRead'))
          }

          // auto-scroll only if user is near bottom (fix #2)
          if (autoScrollRef.current) requestAnimationFrame(scrollToBottom)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(ch)
    }
  }, [activeConversation?.id, user?.id])

  // mark messages as read
  const markAsRead = async (conversationId = activeConversation?.id) => {
    if (!conversationId || !user) return
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('conversation_id', conversationId)
      .eq('recipient_id', user.id)
      .eq('read', false)

    // tell Layout to update Section 1 counter
    window.dispatchEvent(new CustomEvent('messagesRead'))
  }

  // send a new message
  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || sending) return
    setSending(true)

    const otherId =
      activeConversation.participant1 === user.id
        ? activeConversation.participant2
        : activeConversation.participant1

    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          conversation_id: activeConversation.id,
          sender_id: user.id,
          recipient_id: otherId,
          content: newMessage.trim(),
        },
      ])
      .select('*')
      .single()

    if (error) {
      setSending(false)
      alert('Failed to send message. Please try again.')
      return
    }

    // show immediately
    const local = {
      ...data,
      sender: {
        user_id: user.id,
        display_name: user.user_metadata?.full_name || user.email.split('@')[0],
      },
    }
    setMessages((prev) => [...prev, local])
    setNewMessage('')

    // bump this conversation to the top locally (fix #3)
    setConversations((prev) => {
      const updated = prev.map((c) =>
        c.id === activeConversation.id
          ? {
              ...c,
              updated_at: new Date().toISOString(),
              last_message: {
                content: data.content,
                sender_id: user.id,
                created_at: data.created_at,
              },
            }
          : c
      )
      return updated.sort(
        (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
      )
    })

    // auto-scroll after send (fix #2)
    autoScrollRef.current = true
    requestAnimationFrame(scrollToBottom)

    setSending(false)
  }

  // on messages change, only autoscroll when allowed (fix #2)
  useEffect(() => {
    if (autoScrollRef.current) requestAnimationFrame(scrollToBottom)
  }, [messages])

  const formatTime = (timestamp) =>
    new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div
          className="bg-white rounded-xl shadow-sm overflow-hidden"
          style={{ height: 'calc(100vh - 120px)' }}
        >
          <div className="flex h-full">
            {/* ---------------- Section 2: Conversations list ---------------- */}
            <div
              className={`${
                activeConversation ? 'hidden md:block' : 'block'
              } w-full md:w-1/3 border-r border-gray-200 flex flex-col`}
            >
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">💬 Messages</h2>
              </div>

              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">💬</span>
                    </div>
                    <p className="text-gray-600">No conversations yet</p>
                  </div>
                ) : (
                  conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => selectConversation(conversation)}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                        activeConversation?.id === conversation.id
                          ? 'bg-blue-50 border-blue-200'
                          : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {conversation.other_participant?.profile_picture ? (
                          <img
                            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${conversation.other_participant.profile_picture}`}
                            alt="Profile"
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold">
                              {conversation.other_participant?.display_name?.[0]?.toUpperCase() ||
                                '?'}
                            </span>
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {conversation.other_participant?.display_name ||
                                'Unknown User'}
                            </p>

                            {conversation.unread_count > 0 && (
                              <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                {conversation.unread_count}
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-gray-600 truncate">
                            Re: {conversation.listing?.title || 'Property'}
                          </p>

                          {conversation.last_message && (
                            <p className="text-xs text-gray-500 truncate mt-1">
                              {conversation.last_message.content}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ---------------- Section 3: Chat ---------------- */}
            <div
              className={`${
                activeConversation ? 'block' : 'hidden md:block'
              } flex-1 flex flex-col`}
            >
              {activeConversation ? (
                <>
                  {/* Header */}
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setActiveConversation(null)}
                        className="md:hidden text-gray-600 hover:text-gray-900 p-1"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                      </button>

                      {activeConversation.other_participant?.profile_picture ? (
                        <img
                          src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${activeConversation.other_participant.profile_picture}`}
                          alt="Profile"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {activeConversation.other_participant?.display_name?.[0]?.toUpperCase() ||
                              '?'}
                          </span>
                        </div>
                      )}

                      <div>
                        {currentUser?.email ===
                        process.env.NEXT_PUBLIC_ADMIN_EMAIL ? (
                          <button
                            onClick={() =>
                              router.push(
                                `/admin/profile/${activeConversation.other_participant?.user_id}`
                              )
                            }
                            className="font-medium text-blue-600 hover:text-blue-800"
                          >
                            {activeConversation.other_participant?.display_name ||
                              'Unknown User'}
                          </button>
                        ) : (
                          <h3 className="font-medium text-gray-900">
                            {activeConversation.other_participant?.display_name ||
                              'Unknown User'}
                          </h3>
                        )}
                        <p className="text-sm text-gray-600">
                          About: {activeConversation.listing?.title || 'Property'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div
                    ref={messagesContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto p-4 space-y-4"
                  >
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender_id === user.id
                            ? 'justify-end'
                            : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.sender_id === user.id
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              message.sender_id === user.id
                                ? 'text-blue-100'
                                : 'text-gray-500'
                            }`}
                          >
                            {formatTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={sending}
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || sending}
                        className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors"
                      >
                        {sending ? '...' : 'Send'}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-4xl">💬</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Select a conversation
                    </h3>
                    <p className="text-gray-600">
                      Choose a conversation from the list to start messaging
                    </p>
                  </div>
                </div>
              )}
            </div>
            {/* -------------------------------------------------------------- */}
          </div>
        </div>
      </div>
    </div>
  )
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  }
}
