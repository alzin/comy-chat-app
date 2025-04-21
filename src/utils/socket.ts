import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';

let socket: Socket | null = null;

export const initializeSocket = () => {
  if (socket) {
    socket.disconnect();
  }

  // socket = io('http://localhost:5000', {
  socket = io('https://comy-chat-app.onrender.com', {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5
  });
  
  const token = useAuthStore.getState().token;
  
  if (socket && token) {
    socket.emit('authenticate', token);
    setupSocketListeners();
  }
  
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

const setupSocketListeners = () => {
  if (!socket) return;
  
  // Remove any existing listeners before adding new ones
  socket.removeAllListeners();
  
  socket.on('newMessage', (message) => {
    useChatStore.getState().addMessage(message);
  });
  
  socket.on('onlineUsers', (userIds) => {
    useChatStore.getState().updateOnlineUsers(userIds);
  });
  
  socket.on('userStatusChanged', ({ userId, isOnline }) => {
    useChatStore.getState().updateUserStatus(userId, isOnline);
  });
  
  socket.on('userTyping', ({ chatId, userId }) => {
    useChatStore.getState().setUserTyping(chatId, userId, true);
  });
  
  socket.on('userStoppedTyping', ({ chatId, userId }) => {
    useChatStore.getState().setUserTyping(chatId, userId, false);
  });
  
  socket.on('messageReadUpdate', ({ messageId, userId }) => {
    useChatStore.getState().updateMessageReadStatus(messageId, userId);
  });
};

export const sendMessage = (chatId: string, content: string, senderId: string) => {
  if (socket) {
    socket.emit('sendMessage', { chatId, content, senderId });
  }
};

export const sendTypingStatus = (chatId: string, userId: string, isTyping: boolean) => {
  if (socket) {
    socket.emit(isTyping ? 'typing' : 'stopTyping', { chatId, userId });
  }
};

export const markMessageAsRead = (messageId: string, userId: string) => {
  if (socket) {
    socket.emit('messageRead', { messageId, userId });
  }
};