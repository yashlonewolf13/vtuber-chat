import { Server } from 'socket.io';
import { logger } from '../utils/logger.js';
import { handleConversation } from '../controllers/conversation.controller.js';
import { generateVoice } from '../services/elevenlabs.service.js';
import heygenService from '../services/heygen.service.js';

/**
 * Initialize Socket.IO with connection handlers
 * Integrated with HeyGen for avatar streaming
 */
export const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Store HeyGen sessions
  const heygenSessions = new Map();

  // Connection event
  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Store user session data
    socket.data = {
      conversationMode: 'text', // default mode
      conversationHistory: [],
      userId: null,
      heygenSessionId: null,
      isAvatarActive: false
    };

    // ============================================
    // HEYGEN AVATAR SESSION MANAGEMENT
    // ============================================

    /**
     * Start HeyGen avatar session
     */
    socket.on('start-avatar', async () => {
      try {
        logger.info(`Starting HeyGen avatar for client: ${socket.id}`);

        // Create HeyGen streaming session
        const sessionData = await heygenService.createStreamingSession();
        
        // Store session data
        heygenSessions.set(socket.id, {
          sessionId: sessionData.session_id,
          accessToken: sessionData.access_token,
          isActive: false,
        });

        socket.data.heygenSessionId = sessionData.session_id;

        // Send session info to client for WebRTC setup
        socket.emit('avatar-session-created', {
          sessionId: sessionData.session_id,
          accessToken: sessionData.access_token,
        });

        // Start the session
        await heygenService.startSession(sessionData.session_id);
        
        const session = heygenSessions.get(socket.id);
        session.isActive = true;
        socket.data.isAvatarActive = true;

        socket.emit('avatar-started', {
          message: 'Avatar session started successfully',
        });

        logger.info(`HeyGen avatar started for ${socket.id}`);
      } catch (error) {
        logger.error('Error starting HeyGen avatar:', error);
        socket.emit('avatar-error', {
          error: error.message,
        });
      }
    });

    /**
     * Stop HeyGen avatar session
     */
    socket.on('stop-avatar', async () => {
      try {
        const session = heygenSessions.get(socket.id);
        
        if (session && session.sessionId) {
          logger.info(`Stopping HeyGen avatar for ${socket.id}`);
          
          await heygenService.stopSession(session.sessionId);
          heygenSessions.delete(socket.id);
          socket.data.heygenSessionId = null;
          socket.data.isAvatarActive = false;

          socket.emit('avatar-stopped', {
            message: 'Avatar session stopped successfully',
          });

          logger.info(`HeyGen avatar stopped for ${socket.id}`);
        }
      } catch (error) {
        logger.error('Error stopping HeyGen avatar:', error);
        socket.emit('avatar-error', {
          error: error.message,
        });
      }
    });

    /**
     * Handle ICE candidates for WebRTC
     */
    socket.on('ice-candidate', async (data) => {
      try {
        const { candidate } = data;
        const session = heygenSessions.get(socket.id);

        if (session && session.sessionId) {
          await heygenService.sendICE(session.sessionId, candidate);
        }
      } catch (error) {
        logger.error('Error sending ICE candidate:', error);
      }
    });

    // ============================================
    // EXISTING CONVERSATION FUNCTIONALITY
    // ============================================

    /**
     * Set conversation mode (voice or text)
     */
    socket.on('set-mode', ({ mode }) => {
      if (mode !== 'voice' && mode !== 'text') {
        socket.emit('error', { message: 'Invalid mode. Use "voice" or "text"' });
        return;
      }
      
      socket.data.conversationMode = mode;
      logger.info(`Client ${socket.id} switched to ${mode} mode`);
      
      socket.emit('mode-changed', { mode });
    });

    /**
     * Handle text message from user
     * Used in TEXT MODE and VOICE MODE
     * Now integrated with HeyGen for avatar TTS
     */
    socket.on('send-message', async ({ message, userId }) => {
      try {
        if (!message || message.trim().length === 0) {
          socket.emit('error', { message: 'Message cannot be empty' });
          return;
        }

        const mode = socket.data.conversationMode;
        const heygenSession = heygenSessions.get(socket.id);
        const useHeyGen = heygenSession && heygenSession.isActive;
        
        logger.info(`Processing ${mode} message from ${socket.id}: ${message.substring(0, 50)}...`);

        // Show thinking indicator
        socket.emit('avatar-status', { 
          status: 'thinking',
          mode 
        });

        // Add user message to history
        socket.data.conversationHistory.push({
          role: 'user',
          content: message,
          timestamp: new Date().toISOString()
        });

        // Get AI response from OpenAI
        const aiResponse = await handleConversation({
          message,
          history: socket.data.conversationHistory,
          userId
        });

        // Add AI response to history
        socket.data.conversationHistory.push({
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date().toISOString()
        });

        if (mode === 'text') {
          // TEXT MODE: Send text response immediately
          socket.emit('ai-response', {
            message: aiResponse,
            mode: 'text',
            timestamp: new Date().toISOString()
          });

          // If HeyGen is active, also make avatar speak
          if (useHeyGen) {
            socket.emit('avatar-status', { status: 'speaking', mode: 'text' });
            
            try {
              await heygenService.speakText(heygenSession.sessionId, aiResponse);
              
              // Estimate speaking duration
              const speakingDuration = aiResponse.length * 50;
              setTimeout(() => {
                socket.emit('avatar-status', { status: 'idle', mode: 'text' });
              }, speakingDuration);
            } catch (error) {
              logger.error('HeyGen TTS error in text mode:', error);
              socket.emit('avatar-status', { status: 'idle', mode: 'text' });
            }
          } else {
            socket.emit('avatar-status', { status: 'idle', mode: 'text' });
          }

        } else if (mode === 'voice') {
          // VOICE MODE: Generate voice response
          socket.emit('avatar-status', { 
            status: 'speaking',
            mode: 'voice'
          });

          try {
            if (useHeyGen) {
              // Use HeyGen for avatar TTS
              await heygenService.speakText(heygenSession.sessionId, aiResponse);
              
              socket.emit('ai-voice-response', {
                mode: 'voice',
                timestamp: new Date().toISOString(),
                source: 'heygen'
              });

              // Estimate speaking duration
              const speakingDuration = aiResponse.length * 50;
              setTimeout(() => {
                socket.emit('avatar-status', { status: 'idle', mode: 'voice' });
              }, speakingDuration);

            } else {
              // Fallback to ElevenLabs if HeyGen not active
              const audioBuffer = await generateVoice(aiResponse);

              socket.emit('ai-voice-response', {
                audio: audioBuffer.toString('base64'),
                mode: 'voice',
                timestamp: new Date().toISOString(),
                source: 'elevenlabs'
              });

              socket.emit('avatar-status', { status: 'idle', mode: 'voice' });
            }

            // Debug transcript (only in debug mode)
            if (process.env.DEBUG_MODE === 'true') {
              socket.emit('debug-transcript', {
                text: aiResponse,
                timestamp: new Date().toISOString()
              });
            }

          } catch (voiceError) {
            logger.error('Voice generation error:', voiceError);
            socket.emit('error', { 
              message: 'Failed to generate voice response',
              mode: 'voice'
            });
            socket.emit('avatar-status', { status: 'idle', mode: 'voice' });
          }
        }

      } catch (error) {
        logger.error('Error processing message:', error);
        socket.emit('error', { 
          message: 'Failed to process your message. Please try again.',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
        socket.emit('avatar-status', { status: 'idle', mode: socket.data.conversationMode });
      }
    });

    /**
     * Handle voice input from user (speech-to-text already done on client)
     * Used in VOICE MODE
     */
    socket.on('send-voice-message', async ({ transcribedText, userId }) => {
      try {
        if (!transcribedText || transcribedText.trim().length === 0) {
          socket.emit('error', { message: 'Voice message cannot be empty' });
          return;
        }

        logger.info(`Processing voice message from ${socket.id}: ${transcribedText.substring(0, 50)}...`);

        // Use same handler as text messages
        // The mode check inside 'send-message' will handle voice response
        socket.emit('send-message', { 
          message: transcribedText, 
          userId 
        });

      } catch (error) {
        logger.error('Error processing voice message:', error);
        socket.emit('error', { 
          message: 'Failed to process your voice message. Please try again.' 
        });
      }
    });

    /**
     * Clear conversation history
     */
    socket.on('clear-conversation', () => {
      socket.data.conversationHistory = [];
      socket.emit('conversation-cleared');
      logger.info(`Conversation cleared for ${socket.id}`);
    });

    /**
     * Get conversation history
     */
    socket.on('get-history', () => {
      socket.emit('conversation-history', {
        history: socket.data.conversationHistory,
        mode: socket.data.conversationMode
      });
    });

    /**
     * Disconnect event
     */
    socket.on('disconnect', async (reason) => {
      logger.info(`Client disconnected: ${socket.id}, reason: ${reason}`);
      
      // Cleanup HeyGen session on disconnect
      const session = heygenSessions.get(socket.id);
      if (session && session.sessionId) {
        try {
          await heygenService.stopSession(session.sessionId);
          logger.info(`Cleaned up HeyGen session for ${socket.id}`);
        } catch (error) {
          logger.error('Error cleaning up HeyGen session:', error);
        }
      }
      heygenSessions.delete(socket.id);
    });

    /**
     * Error handling
     */
    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });
  });

  // Global error handler
  io.on('error', (error) => {
    logger.error('Socket.IO server error:', error);
  });

  logger.info('Socket.IO initialized successfully with HeyGen integration');
  
  return io;
};