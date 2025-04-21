import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import NewChatModal from '../components/NewChatModal';
import ProfileModal from '../components/ProfileModal';
import { motion, AnimatePresence } from 'framer-motion';

const ChatPage: React.FC = () => {
  const { user } = useAuthStore();
  const { fetchChats } = useChatStore();
  const [isChatModalOpen, setChatModalOpen] = useState(false);
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('userId', user._id);
    }
    fetchChats();
  }, [user, fetchChats]);

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/50 lg:hidden z-40"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div className={`
        w-80 flex-shrink-0 bg-white
        lg:block lg:relative lg:shadow-md
        fixed inset-y-0 left-0 z-50
        transform transition-transform duration-300 ease-in-out
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <Sidebar
          onNewChat={() => setChatModalOpen(true)}
          onProfileClick={() => setProfileModalOpen(true)}
          closeMobileSidebar={() => setMobileSidebarOpen(false)}
        />
      </div>

      {/* Main chat area */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        <ChatArea onMobileMenuClick={() => setMobileSidebarOpen(true)} />
      </main>

      {/* Modals */}
      <AnimatePresence>
        {isChatModalOpen && (
          <NewChatModal onClose={() => setChatModalOpen(false)} />
        )}
        {isProfileModalOpen && (
          <ProfileModal onClose={() => setProfileModalOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatPage;