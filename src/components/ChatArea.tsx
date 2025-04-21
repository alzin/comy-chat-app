import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { Menu, Send, UserCircle, Users, Smile, MessageSquare } from 'lucide-react';
import { sendTypingStatus } from '../utils/socket';
import { motion } from 'framer-motion';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

interface ChatAreaProps {
  onMobileMenuClick: () => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({ onMobileMenuClick }) => {
  const { user } = useAuthStore();
  const { activeChat, messages, sendNewMessage, typingUsers } = useChatStore();
  
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!activeChat || !user) return;

    if (isTyping) {
      sendTypingStatus(activeChat._id, user._id, true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        sendTypingStatus(activeChat._id, user._id, false);
      }, 3000);
    } else {
      sendTypingStatus(activeChat._id, user._id, false);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isTyping, activeChat, user]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !activeChat) return;
    sendNewMessage(message);
    setMessage('');
    setIsTyping(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    if (!isTyping && e.target.value) {
      setIsTyping(true);
    }
  };

  const typingUsernames = activeChat
    ? (typingUsers[activeChat._id] || [])
        .filter(id => id !== user?._id)
        .map(id => {
          const typingUser = activeChat.users.find(u => u._id === id);
          return typingUser?.username || '';
        })
        .filter(Boolean)
    : [];

  const getChatName = () => {
    if (!activeChat) return '';
    if (activeChat.isGroupChat) return activeChat.name;
    const otherUser = activeChat.users.find(u => u._id !== user?._id);
    return otherUser?.username || 'Chat';
  };

  const getChatSubtitle = () => {
    if (!activeChat) return '';
    if (activeChat.isGroupChat) {
      return `${activeChat.users.length} members`;
    }
    const otherUser = activeChat.users.find(u => u._id !== user?._id);
    return otherUser?.isOnline ? 'Online' : 'Offline';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Chat header */}
      <div className="bg-white border-b border-gray-200 flex-none">
        <div className="h-16 flex items-center px-4 sm:px-6">
          <button
            onClick={onMobileMenuClick}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100 text-gray-500"
          >
            <Menu className="h-6 w-6" />
          </button>

          {activeChat ? (
            <div className="flex items-center ml-2 lg:ml-0">
              <div className="relative mr-3">
                {activeChat.isGroupChat ? (
                  <div className="bg-indigo-100 p-2 rounded-full">
                    <Users className="h-8 w-8 text-indigo-600" />
                  </div>
                ) : (
                  <div className="relative">
                    <div className="bg-gray-100 p-2 rounded-full">
                      <UserCircle className="h-8 w-8 text-gray-600" />
                    </div>
                    {activeChat.users.find(u => u._id !== user?._id)?.isOnline && (
                      <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
                    )}
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-lg font-medium text-gray-900">{getChatName()}</h2>
                <p className="text-sm text-gray-500">{getChatSubtitle()}</p>
              </div>
            </div>
          ) : (
            <div className="ml-2 lg:ml-0">
              <h2 className="text-lg font-medium text-gray-900">ChatterBox</h2>
            </div>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="h-full px-4 py-6">
          {!activeChat ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md mx-auto px-4">
                <MessageSquare className="mx-auto h-16 w-16 text-blue-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Welcome to ChatterBox
                </h3>
                <p className="text-gray-600">
                  Select a chat from the sidebar or start a new conversation to begin messaging.
                </p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md mx-auto px-4">
                <MessageSquare className="mx-auto h-12 w-12 text-blue-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No messages yet
                </h3>
                <p className="text-gray-600">Start the conversation!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <MessageBubble
                  key={message._id}
                  message={message}
                  isOwn={message.sender._id === user?._id}
                  showSender={
                    index === 0 ||
                    messages[index - 1].sender._id !== message.sender._id
                  }
                />
              ))}

              {typingUsernames.length > 0 && (
                <div className="flex items-start mt-2">
                  <div className="bg-gray-100 rounded-2xl px-4 py-2 max-w-md">
                    <TypingIndicator />
                    <p className="text-xs text-gray-500 mt-1">
                      {typingUsernames.length === 1
                        ? `${typingUsernames[0]} is typing...`
                        : `${typingUsernames.join(', ')} are typing...`}
                    </p>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Message input */}
      {activeChat && (
        <div className="bg-white border-t border-gray-200 flex-none px-4 py-3">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <button
              type="button"
              className="p-2 rounded-full text-gray-500 hover:bg-gray-100 transition"
            >
              <Smile className="h-6 w-6" />
            </button>
            <input
              type="text"
              value={message}
              onChange={handleInputChange}
              placeholder="Type a message..."
              className="flex-1 py-2 px-4 rounded-full border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={!message.trim()}
              className={`p-3 rounded-full transition ${
                message.trim()
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              <Send className="h-5 w-5" />
            </motion.button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatArea;