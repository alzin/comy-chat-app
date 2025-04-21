import React from 'react';
import { motion } from 'framer-motion';

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          initial={{ y: 0 }}
          animate={{ y: [0, -5, 0] }}
          transition={{
            duration: 0.6,
            ease: 'easeInOut',
            repeat: Infinity,
            repeatType: 'loop',
            delay: i * 0.1,
          }}
          className="w-2 h-2 rounded-full bg-gray-400"
        />
      ))}
    </div>
  );
};

export default TypingIndicator;