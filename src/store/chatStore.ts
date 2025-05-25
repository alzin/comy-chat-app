import { create } from 'zustand';
import api from '../utils/api';
import { ChatState, Chat, Message } from '../types';
import { sendMessage, sendTypingStatus, markMessageAsRead } from '../utils/socket';

interface ChatStore extends ChatState {
  fetchChats: () => Promise<void>;
  fetchMessages: (chatId: string) => Promise<void>;
  createChat: (data: { name?: string, isGroupChat: boolean, users: string[] }) => Promise<Chat>;
  setActiveChat: (chatId: string | null) => Promise<void>;
  sendNewMessage: (content: string) => void;
  addMessage: (message: Message) => void;
  updateOnlineUsers: (userIds: string[]) => void;
  updateUserStatus: (userId: string, isOnline: boolean) => void;
  setUserTyping: (chatId: string, userId: string, isTyping: boolean) => void;
  updateMessageReadStatus: (messageId: string, userId: string) => void;
  markCurrentMessagesAsRead: (userId: string) => void;
  typingUsers: Record<string, string[]>;
  unreadMessages: Record<string, boolean>;
  markChatAsRead: (chatId: string) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  chats: [],
  activeChat: null,
  messages: [],
  isLoadingChats: false,
  isLoadingMessages: false,
  error: null,
  typingUsers: {},
  unreadMessages: {},
  
  fetchChats: async () => {
    set({ isLoadingChats: true, error: null });
    try {
      const response = await api.get('/chats');
      set({ chats: response.data, isLoadingChats: false });
    } catch (error) {
      set({ isLoadingChats: false, error: error as string });
    }
  },
  
  fetchMessages: async (chatId) => {
    set({ isLoadingMessages: true, error: null });
    try {
      const response = await api.get(`/chats/${chatId}/messages`);
      set({ messages: response.data.messages, isLoadingMessages: false });
    } catch (error) {
      set({ isLoadingMessages: false, error: error as string });
    }
  },
  
  createChat: async (data) => {
    set({ isLoadingChats: true, error: null });
    try {
      const response = await api.post('/chats', data);
      const newChat = response.data;
      
      set(state => ({ 
        chats: [newChat, ...state.chats],
        isLoadingChats: false
      }));
      
      return newChat;
    } catch (error) {
      set({ isLoadingChats: false, error: error as string });
      throw error;
    }
  },
  
  setActiveChat: async (chatId) => {
    if (!chatId) {
      set({ activeChat: null, messages: [] });
      return;
    }
    
    const chat = get().chats.find(c => c._id === chatId);
    
    if (chat) {
      set({ activeChat: chat });
      await get().fetchMessages(chatId);
      
      // Mark messages as read
      get().markCurrentMessagesAsRead(localStorage.getItem('userId') || '');
      get().markChatAsRead(chatId);
    }
  },
  
  sendNewMessage: (content) => {
    const activeChat = get().activeChat;
    const userId = localStorage.getItem('userId') || '';
    
    if (!activeChat) return;
    
    // Send message via socket
    sendMessage(activeChat._id, content, userId);
    
    // Stop typing indicator
    sendTypingStatus(activeChat._id, userId, false);
  },
  
  addMessage: (message) => {
    const { messages, chats, activeChat, unreadMessages } = get();
    const userId = localStorage.getItem('userId') || '';
    
    // Update messages if it's for the active chat
    if (activeChat && message.chat === activeChat._id) {
      set({ messages: [...messages, message] });
      
      // Mark message as read if it's the active chat
      if (message.sender._id !== userId) {
        markMessageAsRead(message._id, userId);
      }
    } else if (message.sender._id !== userId) {
      // Add unread indicator for non-active chats
      set({
        unreadMessages: {
          ...unreadMessages,
          [message.chat]: true
        }
      });
    }
    
    // Update the latest message in chats list
    set({
      chats: chats.map(chat => 
        chat._id === message.chat
          ? { ...chat, latestMessage: message }
          : chat
      )
    });
  },
  
  updateOnlineUsers: (userIds) => {
    const { chats } = get();
    
    // Update online status for users in all chats
    set({
      chats: chats.map(chat => ({
        ...chat,
        users: chat.users.map(user => ({
          ...user,
          isOnline: userIds.includes(user._id)
        }))
      }))
    });
  },
  
  updateUserStatus: (userId, isOnline) => {
    const { chats, activeChat } = get();
    
    // Update chats
    set({
      chats: chats.map(chat => ({
        ...chat,
        users: chat.users.map(user => 
          user._id === userId
            ? { ...user, isOnline }
            : user
        )
      }))
    });
    
    // Update active chat if needed
    if (activeChat) {
      set({
        activeChat: {
          ...activeChat,
          users: activeChat.users.map(user => 
            user._id === userId
              ? { ...user, isOnline }
              : user
          )
        }
      });
    }
  },
  
  setUserTyping: (chatId, userId, isTyping) => {
    const typingUsers = { ...get().typingUsers };
    
    if (!typingUsers[chatId]) {
      typingUsers[chatId] = [];
    }
    
    if (isTyping && !typingUsers[chatId].includes(userId)) {
      typingUsers[chatId].push(userId);
    } else if (!isTyping) {
      typingUsers[chatId] = typingUsers[chatId].filter(id => id !== userId);
    }
    
    set({ typingUsers });
  },
  
  updateMessageReadStatus: (messageId, userId) => {
    set(state => ({
      messages: state.messages.map(msg => 
        msg._id === messageId
          ? { 
              ...msg, 
              readBy: [...msg.readBy.map(u => u._id).includes(userId) 
                ? msg.readBy 
                : [...msg.readBy, { _id: userId } as any]] 
            }
          : msg
      )
    }));
  },
  
  markCurrentMessagesAsRead: (userId) => {
    const { messages, activeChat } = get();
    
    if (!activeChat) return;
    
    // Mark all unread messages as read
    messages.forEach(message => {
      if (
        message.sender._id !== userId && 
        !message.readBy.some(user => user._id === userId)
      ) {
        markMessageAsRead(message._id, userId);
      }
    });
  },

  markChatAsRead: (chatId) => {
    set(state => ({
      unreadMessages: {
        ...state.unreadMessages,
        [chatId]: false
      }
    }));
  }
}));