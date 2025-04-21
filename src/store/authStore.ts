import { create } from 'zustand';
import api from '../utils/api';
import { AuthState, User } from '../types';
import { disconnectSocket, initializeSocket } from '../utils/socket';

interface AuthStore extends AuthState {
  register: (username: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuthStatus: () => Promise<void>;
  updateProfile: (username: string, avatar: string) => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,
  
  register: async (username, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/register', {
        username,
        email,
        password,
      });
      
      const { token, ...user } = response.data;
      
      localStorage.setItem('token', token);
      set({ user, token, isAuthenticated: true, isLoading: false });
      
      // Initialize socket connection
      initializeSocket();
    } catch (error) {
      set({ isLoading: false, error: error as string });
    }
  },
  
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });
      
      const { token, ...user } = response.data;
      
      localStorage.setItem('token', token);
      set({ user, token, isAuthenticated: true, isLoading: false });
      
      // Initialize socket connection
      initializeSocket();
    } catch (error) {
      set({ isLoading: false, error: error as string });
    }
  },
  
  logout: () => {
    localStorage.removeItem('token');
    
    // Disconnect socket
    disconnectSocket();
    
    set({ user: null, token: null, isAuthenticated: false });
  },
  
  checkAuthStatus: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isAuthenticated: false });
      return;
    }
    
    set({ isLoading: true });
    try {
      const response = await api.get('/auth/me');
      set({ 
        user: response.data,
        isAuthenticated: true,
        isLoading: false
      });
      
      // Initialize socket
      initializeSocket();
    } catch (error) {
      localStorage.removeItem('token');
      set({ 
        user: null, 
        token: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
  },
  
  updateProfile: async (username, avatar) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put('/users/profile', {
        username,
        avatar
      });
      
      set({ 
        user: response.data as User,
        isLoading: false
      });
    } catch (error) {
      set({ isLoading: false, error: error as string });
    }
  }
}));