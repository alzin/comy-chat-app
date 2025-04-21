import React from 'react';
import { Message } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';
import { motion } from 'framer-motion';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showSender: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn, showSender }) => {
  // Format time
  const time = formatDistanceToNow(new Date(message.createdAt), {
    addSuffix: true,
  });
  
  // Check if message is read
  const isRead = message.readBy.length > 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-xs sm:max-w-sm md:max-w-md ${isOwn ? 'order-1' : 'order-2'}`}>
        {showSender && !isOwn && (
          <div className="ml-1 mb-1">
            <span className="text-xs font-medium text-gray-600">
              {message.sender.username}
            </span>
          </div>
        )}
        
        <div
          className={`
            relative px-4 py-2 rounded-lg shadow-sm
            ${isOwn ? 
              'bg-blue-600 text-white rounded-br-none' : 
              'bg-white text-gray-800 rounded-bl-none'
            }
          `}
        >
          <div className="text-sm">{message.content}</div>
          <div className={`text-xs mt-1 flex justify-end items-center ${isOwn ? 'text-blue-200' : 'text-gray-500'}`}>
            <span>{time}</span>
            {isOwn && (
              <span className="ml-1">
                {isRead ? (
                  <CheckCheck className="h-3 w-3" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;