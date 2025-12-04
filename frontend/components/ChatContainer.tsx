'use client';

import ChatInterface from './ChatInterface';
import MessageInput from './MessageInput';
import type { Message, AvatarStatus, ConversationMode } from '@/hooks/useConversation';

interface ChatContainerProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  avatarStatus: AvatarStatus;
  isAvatarActive: boolean;
  conversationMode: ConversationMode;
}

export default function ChatContainer({
  messages,
  onSendMessage,
  avatarStatus,
  isAvatarActive,
  conversationMode,
}: ChatContainerProps) {
  return (
    <div 
      className="bg-oshi-blue/40 backdrop-blur-lg border border-white/10 shadow-2xl flex flex-col"
      style={{
        width: '696px',
        height: '479px',
        borderRadius: '50px',
        padding: '20px',
        gap: '22px',
        maxWidth: '100%', // Responsive on mobile
      }}
    >
      {/* Mode Indicator Header */}
      <div className="flex-shrink-0 px-4 py-2 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between">
        <span className="text-xs text-white/60">
          {conversationMode === 'text' ? '📝 Text Mode' : '🔊 Speech Mode'}
        </span>
        <span className="text-xs text-white/60">
          {conversationMode === 'text' 
            ? 'Responses shown as text' 
            : 'Avatar speaks responses'}
        </span>
      </div>

      {/* Chat Messages Area - Scrollable */}
      <div className="flex-1 overflow-hidden rounded-2xl bg-white/5">
        <ChatInterface messages={messages} />
      </div>

      {/* Message Input - Fixed at Bottom */}
      <div className="flex-shrink-0">
        <MessageInput
          onSendMessage={onSendMessage}
          avatarStatus={avatarStatus}
          isAvatarActive={isAvatarActive}
          conversationMode={conversationMode}
        />
      </div>
    </div>
  );
}
