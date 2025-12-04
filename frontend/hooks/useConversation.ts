'use client';

import { error } from 'console';
import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5001';

export type AvatarStatus = 'idle' | 'thinking' | 'speaking';
export type ConversationMode = 'text' | 'speech';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function useConversation() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [avatarStatus, setAvatarStatus] = useState<AvatarStatus>('idle');
  const [isAvatarActive, setIsAvatarActive] = useState(false);
  const [conversationMode, setConversationMode] = useState<ConversationMode>('text');
  const [currentAudioElement, setCurrentAudioElement] = useState<HTMLAudioElement | null>(null);
  
  // Audio ref for playing voice responses
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('🎵 Initializing audio element...');
      const audio = new Audio();
      
      audioRef.current = audio;
      setCurrentAudioElement(audio);
      console.log('✅ Audio element initialized');
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // Initialize socket connection
  useEffect(() => {
    const socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('✅ Connected to server');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Disconnected from server');
      setIsConnected(false);
    });

    // Avatar events
    socketInstance.on('avatar-started', () => {
      console.log('✅ Avatar started');
      setIsAvatarActive(true);
      setAvatarStatus('idle');
    });

    socketInstance.on('avatar-stopped', () => {
      console.log('🛑 Avatar stopped');
      setIsAvatarActive(false);
      setAvatarStatus('idle');
    });

    socketInstance.on('avatar-status', ({ status, mode }) => {
      console.log(`📊 Avatar status: ${status} (${mode})`);
      setAvatarStatus(status);
    });

    socketInstance.on('avatar-error', ({ error }) => {
      console.error('❌ Avatar error:', error);
      setAvatarStatus('idle');
    });

    // Mode change event
    socketInstance.on('mode-changed', ({ mode }) => {
      console.log(`🔄 Mode changed to: ${mode}`);
      setConversationMode(mode);
    });

    // Text response (for text mode)
    socketInstance.on('ai-response', ({ message, timestamp }) => {
      console.log('📝 Received text response:', message);
      
      const newMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: message,
        timestamp: new Date(timestamp),
      };
      
      setMessages((prev) => [...prev, newMessage]);
      setAvatarStatus('idle');
    });

    // Voice response (for speech mode)
    socketInstance.on('ai-voice-response', ({ audio, message, timestamp }) => {
      console.log('🎙️ Received voice response');
      console.log('📊 Audio data length:', audio?.length || 0);
      console.log('💬 Message:', message);
      
      const newMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: message,
        timestamp: new Date(timestamp),
      };
      
      setMessages((prev) => [...prev, newMessage]);
      
      // Play audio
      if (audio && audioRef.current) {
        try {
          console.log('🔄 Converting base64 to audio...');
          
          // Convert base64 to blob URL
          const binaryString = atob(audio);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'audio/mpeg' });
          const audioUrl = URL.createObjectURL(blob);
          
          console.log('🔊 Setting audio source...');
          audioRef.current.src = audioUrl;
          audioRef.current.volume = 1.0;
          
          // CRITICAL: Update state IMMEDIATELY so AvatarDisplay can connect
          setCurrentAudioElement(audioRef.current);
          console.log('📻 Audio element state updated - lip-sync can now connect');
          
          // Set up event handlers BEFORE playing
          audioRef.current.onloadeddata = () => {
            console.log('📥 Audio data loaded, ready to play');
          };
          
          audioRef.current.onplay = () => {
            console.log('▶️ Audio started playing - LIP-SYNC SHOULD START NOW');
            setAvatarStatus('speaking');
          };
          
          audioRef.current.onended = () => {
            console.log('⏹️ Audio playback finished');
            URL.revokeObjectURL(audioUrl);
            setAvatarStatus('idle');
          };
          
          audioRef.current.onerror = (e) => {
            console.error('❌ Audio playback error during voice response:', e);
            URL.revokeObjectURL(audioUrl);
            setAvatarStatus('idle');
          };
          
          // Play audio
          console.log('🎬 Starting playback...');
          //const playPromise = audioRef.current.play();
          
          if (audioRef.current && (window as any).audioContextForLipSync) {
            const ctx = (window as any).audioContextForLipSync;
            if(ctx.state === 'suspended') {
              console.log('Resuming suspended AudioContext...');
              ctx.resume();
            }
          }

          const playPromise = audioRef.current.play();

          if(playPromise !== undefined) {
            playPromise.then(() => {
              console.log('Audio playing successfully - lip-sync active');
            })
            .catch((error) => {
              console.error('Audio play failed:', error);
              setAvatarStatus('idle');
            });
          }
        } catch(error) {
          console.error('Error processing voice response:', error);
          setAvatarStatus('idle');
        }
      }
    });

    // Error event
    socketInstance.on('error', ({ message: errorMessage }) => {
      console.error('❌ Socket error:', errorMessage);
      setAvatarStatus('idle');
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Send message
  const sendMessage = useCallback((message: string) => {
    if (!socket || !message.trim()) return;

    console.log('📤 Sending message:', message);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    socket.emit('send-message', {
      message,
      userId: 'user123',
    });
  }, [socket]);

  // Start avatar
  const startAvatar = useCallback(() => {
    if (!socket) return;
    console.log('🎬 Starting avatar...');
    socket.emit('start-avatar');
  }, [socket]);

  // Stop avatar
  const stopAvatar = useCallback(() => {
    if (!socket) return;
    console.log('🛑 Stopping avatar...');
    socket.emit('stop-avatar');
  }, [socket]);

  // Change conversation mode
  const changeMode = useCallback((mode: ConversationMode) => {
    if (!socket) return;
    console.log('🔄 Changing mode to:', mode);
    socket.emit('set-mode', { mode });
  }, [socket]);

  return {
    messages,
    avatarStatus,
    isConnected,
    isAvatarActive,
    conversationMode,
    audioElement: currentAudioElement,
    sendMessage,
    startAvatar,
    stopAvatar,
    changeMode,
  };
}
