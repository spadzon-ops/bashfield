import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import { supabase } from '../lib/supabase'

export default function Messages() {
  const { t } = useTranslation('common')
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [conversations, setConversations] = useState([])
  const [activeConversation, setActiveConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  // CRITICAL: Set active conversation globally on mount and clear on unmount
  useEffect(() => {
    const handleRouteChange = () => {
      window.activeConversationId = null
      window.dispatchEvent(new CustomEvent('activeConversationChanged', { detail: null }))
    }

    router.events.on('routeChangeStart', handleRouteChange)
    
    return () => {
      router.events.off('routeChangeStart', handleRouteChange)
      window.activeConversationId = null
      window.dispatchEvent(new CustomEvent('activeConversationChanged', { detail: null }))
    }
  }, [router.events])

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const conversationId = urlParams.get('conversation')
    
    if (conversationId && conversations.length > 0) {
      const conversation = conversations.find(c => c.id === conversationId)
      if (conversation) {
        selectConversation(conversation)
      }
    }
  }, [conversations])

  // Handle active conversation changes
  useEffect(() => {
    if (activeConversation) {
      window.activeConversationId = activeConversation.id
      window.dispatchEvent(new CustomEvent('activeConversationChanged', { detail: activeConversation.id }))
      fetchMessages()
      markAsRead()
    } else {
      window.activeConversationId = null
      window.dispatchEvent(new CustomEvent('activeConversationChanged', { detail: null }))
    }
  }, [activeConversation])

  // Real-time subscriptions
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`messages-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        const newMsg = payload.new
        
        // If message is for active conversation, add to messages
        if (activeConversation && newMsg.conversation_id === activeConversation.id) {
          if (newMsg.recipient_id === user.id) {
            // Mark as read immediately for active conversation
            supabase
              .from('messages')
              .update({ read: true })
              .eq('id', newMsg.id)
              .then(() => {
                // Add to messages with sender info
                addMessageToActive(newMsg)
              })
          } else {
            addMessageToActive(newMsg)
          }
        }
        
        // Always refresh conversations to update order and counts
        fetchConversations()
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages'
      }, () => {
        fetchConversations()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, activeConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const addMessageToActive = async (newMsg) => {
    // Get sender profile
    const { data: senderProfile } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, profile_picture')
      .eq('user_id', newMsg.sender_id)
      .single()

    const messageWithProfile = {
      ...newMsg,
      sender: senderProfile || { user_id: newMsg.sender_id, display_name: 'Unknown User' }
    }

    setMessages(prev => {
      const exists = prev.find(m => m.id === newMsg.id)
      if (exists) return prev
      return [...prev, messageWithProfile]
    })
  }

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/')
      return
    }

    setUser(user)
    await fetchConversations()
    setLoading(false)
  }

  const fetchConversations = async () => {
    if (!user) return

    const { data: conversationsData, error } = await supabase
      .from('conversations')
      .select('*')
      .or(`participant1.eq.${user.id},participant2.eq.${user.id}`)
      .order('updated_at', { ascending: false })

    if (conversationsData && !error) {
      const participantIds = [...new Set(conversationsData.flatMap(c => [c.participant1, c.participant2]))]
      const listingIds = [...new Set(conversationsData.map(c => c.listing_id))]
      
      const { data: profilesData } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, profile_picture')
        .in('user_id', participantIds)
      
      const { data: listingsData } = await supabase
        .from('listings')
        .select('id, title')
        .in('id', listingIds)
      
      const { data: lastMessagesData } = await supabase
        .from('messages')
        .select('conversation_id, content, created_at, sender_id')
        .in('conversation_id', conversationsData.map(c => c.id))
        .order('created_at', { ascending: false })
      
      const { data: unreadData } = await supabase
        .from('messages')
        .select('conversation_id, id')
        .in('conversation_id', conversationsData.map(c => c.id))
        .eq('recipient_id', user.id)
        .eq('read', false)
      
      const conversationsWithDetails = conversationsData.map(conv => {
        const otherParticipantId = conv.participant1 === user.id ? conv.participant2 : conv.participant1
        const otherParticipant = profilesData?.find(p => p.user_id === otherParticipantId)
        const listing = listingsData?.find(l => l.id === conv.listing_id)
        const lastMessage = lastMessagesData?.find(m => m.conversation_id === conv.id)
        let unreadCount = unreadData?.filter(m => m.conversation_id === conv.id).length || 0
        
        // CRITICAL: No unread count for active conversation
        if (activeConversation && conv.id === activeConversation.id) {
          unreadCount = 0
        }
        
        return {
          ...conv,
          other_participant: otherParticipant,
          listing: listing,
          last_message: lastMessage,
          unread_count: unreadCount
        }
      })
      
      // CRITICAL: Sort by updated_at to keep most recent at top
      const sortedConversations = conversationsWithDetails.sort((a, b) => 
        new Date(b.updated_at) - new Date(a.updated_at)
      )
      
      setConversations(sortedConversations)
    }
  }

  const selectConversation = async (conversation) => {
    // CRITICAL: Set active conversation immediately
    window.activeConversationId = conversation.id
    window.dispatchEvent(new CustomEvent('activeConversationChanged', { detail: conversation.id }))
    
    setActiveConversation(conversation)
    
    // Mark messages as read immediately
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('conversation_id', conversation.id)
      .eq('recipient_id', user.id)
      .eq('read', false)
    
    // Update local conversation unread count
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversation.id 
          ? { ...conv, unread_count: 0 }
          : conv
      )
    )
    
    // Trigger global notification update
    window.dispatchEvent(new CustomEvent('messagesRead'))
  }

  const fetchMessages = async () => {
    if (!activeConversation) return

    const { data: messagesData, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', activeConversation.id)
      .order('created_at', { ascending: true })

    if (messagesData && !error) {
      const senderIds = [...new Set(messagesData.map(m => m.sender_id))]
      const { data: profilesData } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, profile_picture')
        .in('user_id', senderIds)
      
      const messagesWithProfiles = messagesData.map(message => ({
        ...message,
        sender: profilesData?.find(p => p.user_id === message.sender_id) || {
          user_id: message.sender_id,
          display_name: 'Unknown User'
        }
      }))
      
      setMessages(messagesWithProfiles)
    }
  }

  const markAsRead = async () => {
    if (!activeConversation || !user) return

    await supabase
      .from('messages')
      .update({ read: true })
      .eq('conversation_id', activeConversation.id)
      .eq('recipient_id', user.id)
      .eq('read', false)

    // Trigger global notification update
    window.dispatchEvent(new CustomEvent('messagesRead'))
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || sending) return

    setSending(true)
    
    const otherParticipantId = activeConversation.participant1 === user.id 
      ? activeConversation.participant2 
      : activeConversation.participant1

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: activeConversation.id,
          sender_id: user.id,
          recipient_id: otherParticipantId,
          content: newMessage.trim(),
          read: false
        })
        .select()
        .single()

      if (error) throw error

      const messageWithProfile = {
        ...data,
        sender: {
          user_id: user.id,
          display_name: user.user_metadata?.full_name || user.email.split('@')[0]
        }
      }

      setMessages(prev => [...prev, messageWithProfile])
      setNewMessage('')
      
      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', activeConversation.id)
        
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message. Please try again.')
    }

    setSending(false)
  }

  const scrollToBottom = () => {
    const messagesContainer = messagesEndRef.current?.parentElement
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight
    }
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

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
        <div className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ height: 'calc(100vh - 120px)' }}>
          <div className="flex h-full">
            {/* Conversations List */}
            <div className={`${activeConversation ? 'hidden md:block' : 'block'} w-full md:w-1/3 border-r border-gray-200 flex flex-col`}>
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
                  conversations.map(conversation => (
                    <div
                      key={conversation.id}
                      onClick={() => selectConversation(conversation)}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                        activeConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
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
                              {conversation.other_participant?.display_name?.[0]?.toUpperCase() || '?'}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {conversation.other_participant?.display_name || 'Unknown User'}
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

            {/* Chat Area */}
            <div className={`${activeConversation ? 'block' : 'hidden md:block'} flex-1 flex flex-col`}>
              {activeConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setActiveConversation(null)}
                        className="md:hidden text-gray-600 hover:text-gray-900 p-1"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
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
                            {activeConversation.other_participant?.display_name?.[0]?.toUpperCase() || '?'}
                          </span>
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {activeConversation.other_participant?.display_name || 'Unknown User'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          About: {activeConversation.listing?.title || 'Property'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map(message => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender_id === user.id
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-900'
                        }`}>
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.sender_id === user.id ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {formatTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
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
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                    <p className="text-gray-600">Choose a conversation from the list to start messaging</p>
                  </div>
                </div>
              )}
            </div>
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