import { create } from 'zustand'

export const useNotifications = create((set, get) => ({
  activeConversationId: null,
  unreadByConversation: {},
  setActiveConversation: (id) => set({ activeConversationId: id }),
  setUnread: (id, count) => set({
    unreadByConversation: { ...get().unreadByConversation, [id]: count }
  }),
  bulkSetUnread: (map) => set({ unreadByConversation: map }),
}))

export const useTotalUnread = () => {
  const unreadByConversation = useNotifications(s => s.unreadByConversation)
  return Object.values(unreadByConversation).reduce((a, b) => a + (b || 0), 0)
}