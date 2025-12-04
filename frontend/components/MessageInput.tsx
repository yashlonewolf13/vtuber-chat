'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AvatarStatus, ConversationMode } from '@/hooks/useConversation';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  avatarStatus: AvatarStatus;
  isAvatarActive: boolean;
  conversationMode: ConversationMode;
}

export default function MessageInput({
  onSendMessage,
  avatarStatus,
  isAvatarActive,
  conversationMode,
}: MessageInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (message.trim() && avatarStatus !== 'thinking' && avatarStatus !== 'speaking') {
      onSendMessage(message);
      setMessage('');
    }
  };

  const isDisabled = avatarStatus === 'thinking' || avatarStatus === 'speaking';
  
  const placeholderText = conversationMode === 'text'
    ? 'Type your message... (Text mode)'
    : isAvatarActive
      ? 'Type your message... (Avatar will speak)'
      : 'Type your message... (Start avatar for speech)';

  return (
    <div className="p-4 bg-white/5 border-t border-white/10">
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={placeholderText}
            disabled={isDisabled}
            className="w-full px-4 py-3 bg-white/10 backdrop-blur-md rounded-2xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
          />
          
          {/* Mode indicator icon */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {conversationMode === 'speech' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 px-2 py-1 bg-pink-500/20 rounded-lg"
              >
                <svg className="w-3 h-3 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
                <span className="text-xs text-pink-400 font-medium">Voice</span>
              </motion.div>
            )}
          </div>
        </div>

        <motion.button
          type="submit"
          disabled={isDisabled || !message.trim()}
          className={`px-6 py-3 rounded-2xl font-bold transition-all ${
            isDisabled || !message.trim()
              ? 'bg-white/10 text-white/30 cursor-not-allowed'
              : conversationMode === 'speech'
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg hover:shadow-xl'
                : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl'
          }`}
          whileHover={!isDisabled && message.trim() ? { scale: 1.05 } : {}}
          whileTap={!isDisabled && message.trim() ? { scale: 0.95 } : {}}
        >
          {avatarStatus === 'thinking' ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Thinking...
            </span>
          ) : avatarStatus === 'speaking' ? (
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
              Speaking...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Send
            </span>
          )}
        </motion.button>
      </form>

      {/* Status message */}
      {conversationMode === 'speech' && !isAvatarActive && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-xs text-yellow-400/80 text-center"
        >
          ⚠️ Start the avatar to enable speech responses
        </motion.p>
      )}
    </div>
  );
}
