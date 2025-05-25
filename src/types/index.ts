export interface User {
  _id: string;
  username: string;
  email: string;
  avatar: string;
  isOnline: boolean;
  lastActive: string;
}

export interface Message {
  _id: string;
  sender: User;
  content: string;
  chat: string;
  readBy: User[];
  createdAt: string;
  updatedAt: string;
}

export interface Chat {
  _id: string;
  name: string | null;
  isGroupChat: boolean;
  users: User[];
  admin: User | null;
  latestMessage: Message | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ChatState {
  chats: Chat[];
  activeChat: Chat | null;
  messages: Message[];
  isLoadingChats: boolean;
  isLoadingMessages: boolean;
  error: string | null;
  unreadMessages: Record<string, boolean>;
}