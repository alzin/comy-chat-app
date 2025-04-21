import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { Search, X, Users, User } from 'lucide-react';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';

interface NewChatModalProps {
  onClose: () => void;
}

const NewChatModal: React.FC<NewChatModalProps> = ({ onClose }) => {
  const { user } = useAuthStore();
  const { createChat, setActiveChat } = useChatStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [isGroupChat, setIsGroupChat] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const searchUsers = async () => {
    if (!searchTerm) {
      setSearchResults([]);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/users/search?search=${searchTerm}`);
      // Filter out current user and already selected users
      const filteredUsers = response.data.filter(
        (u: any) => 
          u._id !== user?._id && 
          !selectedUsers.some(selected => selected._id === u._id)
      );
      setSearchResults(filteredUsers);
    } catch (error) {
      setError('Error searching for users');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchTerm) searchUsers();
    }, 500);
    
    return () => clearTimeout(delaySearch);
  }, [searchTerm]);
  
  const handleUserSelect = (selectedUser: any) => {
    setSelectedUsers([...selectedUsers, selectedUser]);
    setSearchResults(searchResults.filter(u => u._id !== selectedUser._id));
    setSearchTerm('');
  };
  
  const handleUserRemove = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u._id !== userId));
  };
  
  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    
    if (isGroupChat && !groupName) {
      setError('Group name is required');
      setIsLoading(false);
      return;
    }
    
    if (selectedUsers.length === 0) {
      setError('Please select at least one user');
      setIsLoading(false);
      return;
    }
    
    try {
      const chatData = {
        name: isGroupChat ? groupName : undefined,
        isGroupChat,
        users: selectedUsers.map(u => u._id)
      };
      
      const newChat = await createChat(chatData);
      await setActiveChat(newChat._id);
      onClose();
    } catch (error) {
      setError('Failed to create chat');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-md"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">
            {isGroupChat ? 'Create Group Chat' : 'New Conversation'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6">
          {/* Chat type selector */}
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setIsGroupChat(false)}
              className={`flex-1 py-3 rounded-lg flex items-center justify-center space-x-2 ${
                !isGroupChat 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } transition-colors`}
            >
              <User className="h-5 w-5" />
              <span>Direct Message</span>
            </button>
            <button
              onClick={() => setIsGroupChat(true)}
              className={`flex-1 py-3 rounded-lg flex items-center justify-center space-x-2 ${
                isGroupChat 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } transition-colors`}
            >
              <Users className="h-5 w-5" />
              <span>Group Chat</span>
            </button>
          </div>
          
          {/* Group name input (for group chats) */}
          {isGroupChat && (
            <div className="mb-4">
              <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-1">
                Group Name
              </label>
              <input
                id="groupName"
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name..."
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}
          
          {/* Selected users */}
          {selectedUsers.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selected Users:
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map(user => (
                  <div 
                    key={user._id}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center"
                  >
                    <span>{user.username}</span>
                    <button
                      onClick={() => handleUserRemove(user._id)}
                      className="ml-1.5 text-blue-600 hover:text-blue-800"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* User search */}
          <div className="mb-6">
            <label htmlFor="userSearch" className="block text-sm font-medium text-gray-700 mb-1">
              Add Users
            </label>
            <div className="relative">
              <input
                id="userSearch"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by username or email..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Search className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
            </div>
            
            {/* Search results */}
            {isLoading ? (
              <div className="mt-2 text-center py-2">
                <div className="animate-spin h-5 w-5 border-t-2 border-blue-500 rounded-full mx-auto"></div>
              </div>
            ) : searchResults.length > 0 ? (
              <ul className="mt-1 max-h-40 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-sm">
                {searchResults.map(user => (
                  <li 
                    key={user._id}
                    onClick={() => handleUserSelect(user)}
                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center"
                  >
                    <div className="bg-gray-100 p-1 rounded-full mr-2">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{user.username}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : searchTerm && !isLoading ? (
              <p className="mt-2 text-sm text-gray-500 text-center py-2">No users found</p>
            ) : null}
          </div>
          
          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          {/* Action buttons */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || selectedUsers.length === 0 || (isGroupChat && !groupName)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating...' : 'Create Chat'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default NewChatModal;