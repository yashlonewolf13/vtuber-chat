'use client';

import { useState, KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { AvatarStatus } from '@/hooks/useConversation';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  avatarStatus: AvatarStatus;
  isAvatarActive: boolean;
}

export default function MessageInput({ onSendMessage, avatarStatus, isAvatarActive }: MessageInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && avatarStatus === 'idle' && isAvatarActive) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isDisabled = avatarStatus !== 'idle' || !isAvatarActive;

  return (
    <div className="px-6 py-4 border-t border-white/10">
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isDisabled}
          placeholder={
            !isAvatarActive
              ? 'Start avatar to begin chatting...'
              : avatarStatus === 'thinking'
              ? 'AI is thinking...'
              : avatarStatus === 'speaking'
              ? 'AI is speaking...'
              : 'type your message here...'
          }
          className="flex-1 bg-oshi-blue/50 text-white placeholder-gray-400 px-6 py-3 rounded-full
                   focus:outline-none focus:ring-2 focus:ring-oshi-bright-blue
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all"
        />
        <motion.button
          onClick={handleSend}
          disabled={isDisabled || !message.trim()}
          className={`px-6 py-3 rounded-full font-bold transition-all ${
            isDisabled || !message.trim()
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-oshi-bright-blue text-white hover:bg-blue-600 shadow-lg'
          }`}
          whileHover={!isDisabled && message.trim() ? { scale: 1.05 } : {}}
          whileTap={!isDisabled && message.trim() ? { scale: 0.95 } : {}}
        >
          <span className="flex items-center gap-2">
            send
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </span>
        </motion.button>
      </div>
    </div>
  );
}
