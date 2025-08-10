import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'

export default function Chat() {
  const router = useRouter()
  const { listingId } = router.query
  const [user, setUser] = useState(null)
  const [listing, setListing] = useState(null)
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user && listingId) {
        await fetchListing()
        await findOrCreateConversation(user)
      } else {
        setLoading(false)
      }
    }
    getUser()
  }, [listingId])

  // Real-time message subscription
  useEffect(() => {
    if (!conversation) return

    const channel = supabase
      .channel(`messages-${conversation.id}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversation.id}` },
        (payload) => {
          const newMsg = payload.new
          setMessages(prev => {
            // Avoid duplicates
            if (prev.find(m => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchListing = async () => {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('id', listingId)
      .single()

    if (!error && data) {
      setListing(data)
    }
  }

  const findOrCreateConversation = async (user) => {
    // First, get the listing and its owner
    const { data: listingData } = await supabase
      .from('listings')
      .select('*, user_id')
      .eq('id', listingId)
      .single()

    if (!listingData) {
      setLoading(false)
      return
    }

    // Check if conversation already exists
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('*')
      .eq('listing_id', listingId)
      .or(`and(participant1.eq.${user.id},participant2.eq.${listingData.user_id}),and(participant1.eq.${listingData.user_id},participant2.eq.${user.id})`)
      .single()

    let conversationData = existingConv

    // Create conversation if it doesn't exist
    if (!existingConv) {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({
          listing_id: listingId,
          participant1: user.id,
          participant2: listingData.user_id
        })
        .select()
        .single()
      
      conversationData = newConv
    }

    setConversation(conversationData)
    await fetchMessages(conversationData.id)
    setLoading(false)
  }

  const fetchMessages = async (conversationId) => {
    const { data: messagesData } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (messagesData) {
      setMessages(messagesData)
      
      // Mark messages as read
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .eq('recipient_id', user.id)
        .eq('read', false)
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !user || !conversation || sending) return

    setSending(true)
    
    const otherParticipantId = conversation.participant1 === user.id 
      ? conversation.participant2 
      : conversation.participant1

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: user.id,
          recipient_id: otherParticipantId,
          content: newMessage.trim(),
          read: false
        })
        .select()
        .single()

      if (error) throw error

      // Message will be added via real-time subscription
      setNewMessage('')
      
      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversation.id)
        
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message. Please try again.')
    }

    setSending(false)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="card p-8 text-center max-w-md w-full">
          <span className="text-4xl block mb-4">🔒</span>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Login Required</h2>
          <p className="text-gray-600 mb-6">Please login to start chatting about this property.</p>
          <button 
            onClick={() => window.close()}
            className="btn-primary w-full"
          >
            Close Window
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => window.close()}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ←
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{listing?.title || 'Property Chat'}</h1>
              <p className="text-sm text-gray-600">Chat with property owner</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-blue-600">
              {listing?.currency === 'USD' ? '$' : ''}{listing?.price?.toLocaleString() || '---'}
            </span>
            <span className="text-gray-500 text-sm">
              {listing?.currency === 'USD' ? 'USD' : 'IQD'}/month
            </span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl block mb-4">💬</span>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Start the conversation</h3>
            <p className="text-gray-600">Send a message to inquire about this property.</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div 
              key={index}
              className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.sender_id === user.id 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white border border-gray-200 text-gray-900'
              }`}>
                <p className="text-sm">{message.content}</p>
                <p className={`text-xs mt-1 ${
                  message.sender_id === user.id ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {new Date(message.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={sendMessage} className="flex space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            {sending ? '...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  )
}