import React, { useState } from 'react';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Users, UserCircle, LogOut, PlusCircle, Search } from 'lucide-react';
import { motion } from 'framer-motion';

interface SidebarProps {
  onNewChat: () => void;
  onProfileClick: () => void;
  closeMobileSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onNewChat, onProfileClick, closeMobileSidebar }) => {
  const { user, logout } = useAuthStore();
  const { chats, setActiveChat, activeChat } = useChatStore();
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredChats = chats.filter(chat => {
    if (!searchTerm) return true;
    
    // For group chats, search by name
    if (chat.isGroupChat && chat.name) {
      return chat.name.toLowerCase().includes(searchTerm.toLowerCase());
    }
    
    // For direct chats, search by username
    const otherUser = chat.users.find(u => u._id !== user?._id);
    return otherUser?.username.toLowerCase().includes(searchTerm.toLowerCase());
  });
  
  const handleChatSelect = async (chatId: string) => {
    await setActiveChat(chatId);
    closeMobileSidebar();
  };
  
  const getChatName = (chat: any) => {
    if (chat.isGroupChat) return chat.name;
    
    const otherUser = chat.users.find((u: any) => u._id !== user?._id);
    return otherUser?.username || 'Chat';
  };
  
  const getLastMessage = (chat: any) => {
    if (!chat.latestMessage) return 'No messages yet';
    return chat.latestMessage.content.length > 30
      ? `${chat.latestMessage.content.substring(0, 30)}...`
      : chat.latestMessage.content;
  };
  
  const getLastMessageTime = (chat: any) => {
    if (!chat.latestMessage) return '';
    return formatDistanceToNow(new Date(chat.latestMessage.createdAt), { addSuffix: true });
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <MessageSquare className="h-6 w-6 mr-2" />
            <h1 className="text-xl font-bold">ChatterBox</h1>
          </div>
          <button
            onClick={onNewChat}
            className="p-1 rounded-full hover:bg-white/20 transition-colors"
            aria-label="New chat"
          >
            <PlusCircle className="h-6 w-6" />
          </button>
        </div>
      </div>
      
      {/* Search */}
      <div className="px-4 pt-4 pb-2">
        <div className="relative">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <Search className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
        </div>
      </div>
      
      {/* Chats list */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-5 text-center">
            <MessageSquare className="h-10 w-10 mb-2 opacity-50" />
            <p>No conversations yet</p>
            <button
              onClick={onNewChat}
              className="mt-3 px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-colors"
            >
              Start a new chat
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredChats.map((chat) => (
              <motion.li
                key={chat._id}
                whileHover={{ backgroundColor: 'rgba(249, 250, 251, 1)' }}
                whileTap={{ backgroundColor: 'rgba(243, 244, 246, 1)' }}
                onClick={() => handleChatSelect(chat._id)}
                className={`px-4 py-3 cursor-pointer transition-colors ${
                  activeChat?._id === chat._id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="flex items-start">
                  <div className="relative flex-shrink-0">
                    {chat.isGroupChat ? (
                      <div className="bg-indigo-100 p-2 rounded-full">
                        <Users className="h-8 w-8 text-indigo-600" />
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="bg-gray-100 p-2 rounded-full">
                          <UserCircle className="h-8 w-8 text-gray-600" />
                        </div>
                        {chat.users.find((u: any) => u._id !== user?._id)?.isOnline && (
                          <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-medium text-gray-900 truncate">
                        {getChatName(chat)}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {getLastMessageTime(chat)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate mt-1">
                      {getLastMessage(chat)}
                    </p>
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
      
      {/* User profile */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <button
            onClick={onProfileClick}
            className="flex items-center flex-1 min-w-0"
          >
            <div className="bg-blue-100 p-1 rounded-full">
              <UserCircle className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-3 truncate">
              <p className="text-sm font-medium text-gray-900">{user?.username}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </button>
          <button
            onClick={logout}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors ml-2"
            aria-label="Log out"
          >
            <LogOut className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;