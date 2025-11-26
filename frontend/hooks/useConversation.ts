import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket } from '@/lib/socket';

export type ConversationMode = 'text' | 'voice';
export type AvatarStatus = 'idle' | 'thinking' | 'speaking';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  type: 'text' | 'voice';
  audio?: Blob;
}

export const useConversation = () => {
  const [mode, setMode] = useState<ConversationMode>('text');
  const [messages, setMessages] = useState<Message[]>([]);
  const [avatarStatus, setAvatarStatus] = useState<AvatarStatus>('idle');
  const [isConnected, setIsConnected] = useState(false);
  const [isAvatarActive, setIsAvatarActive] = useState(false);
  
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = getSocket();
    const socket = socketRef.current;

    // Connection events
    socket.on('connect', () => {
      console.log('Connected to backend');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from backend');
      setIsConnected(false);
    });

    // Mode change confirmation
    socket.on('mode-changed', ({ mode: newMode }: { mode: ConversationMode }) => {
      console.log('Mode changed to:', newMode);
      setMode(newMode);
    });

    // Avatar status updates
    socket.on('avatar-status', ({ status }: { status: AvatarStatus }) => {
      setAvatarStatus(status);
    });

    // TEXT MODE: Receive text response
    socket.on('ai-response', ({ message, timestamp }: { message: string; timestamp: string }) => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: message,
        timestamp,
        type: 'text'
      }]);
    });

    // VOICE MODE: Receive audio response
    socket.on('ai-voice-response', ({ audio, timestamp }: { audio: string; timestamp: string }) => {
      // Convert base64 to blob and play
      const audioBlob = base64ToBlob(audio, 'audio/mpeg');
      playAudio(audioBlob);
      
      // Add placeholder message (no text in voice mode!)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '[Voice Response]',
        timestamp,
        type: 'voice',
        audio: audioBlob
      }]);
    });

    // Error handling
    socket.on('error', ({ message: errorMsg }: { message: string }) => {
      console.error('Socket error:', errorMsg);
      alert(errorMsg);
    });

    // Cleanup
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('mode-changed');
      socket.off('avatar-status');
      socket.off('ai-response');
      socket.off('ai-voice-response');
      socket.off('error');
    };
  }, []);

  // Switch between voice and text mode
  const switchMode = useCallback((newMode: ConversationMode) => {
    if (socketRef.current) {
      socketRef.current.emit('set-mode', { mode: newMode });
    }
  }, []);

  // Send message
  const sendMessage = useCallback((message: string, userId = 'user123') => {
    if (!socketRef.current || !message.trim()) return;

    // Add user message to UI
    setMessages(prev => [...prev, {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      type: 'text'
    }]);

    // Send to backend
    socketRef.current.emit('send-message', { message, userId });
  }, []);

  // Clear conversation
  const clearConversation = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('clear-conversation');
      setMessages([]);
    }
  }, []);

  // Start avatar
  const startAvatar = useCallback(() => {
    setIsAvatarActive(true);
    // You can emit a socket event here if needed
  }, []);

  // Stop avatar
  const stopAvatar = useCallback(() => {
    setIsAvatarActive(false);
    // Stop any playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  // Helper: Convert base64 to blob
  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  // Helper: Play audio
  const playAudio = (audioBlob: Blob) => {
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    
    audio.play().catch(err => {
      console.error('Failed to play audio:', err);
    });

    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      audioRef.current = null;
    };
  };

  return {
    mode,
    messages,
    avatarStatus,
    isConnected,
    isAvatarActive,
    switchMode,
    sendMessage,
    clearConversation,
    startAvatar,
    stopAvatar,
  };
};
