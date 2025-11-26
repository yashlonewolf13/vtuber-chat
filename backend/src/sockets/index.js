import { Server } from 'socket.io';
import { logger } from '../utils/logger.js';
import { handleConversation } from '../controllers/conversation.controller.js';
import { generateVoice } from '../services/elevenlabs.service.js';

/**
 * Initialize Socket.IO with connection handlers
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

  // Connection event
  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Store user session data
    socket.data = {
      conversationMode: 'text', // default mode
      conversationHistory: [],
      userId: null
    };

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
     * Used in TEXT MODE
     */
    socket.on('send-message', async ({ message, userId }) => {
      try {
        if (!message || message.trim().length === 0) {
          socket.emit('error', { message: 'Message cannot be empty' });
          return;
        }

        const mode = socket.data.conversationMode;
        
        logger.info(`Processing ${mode} message from ${socket.id}: ${message.substring(0, 50)}...`);

        // Show typing indicator
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

          socket.emit('avatar-status', { status: 'idle', mode: 'text' });

        } else if (mode === 'voice') {
          // VOICE MODE: Generate voice and send audio only
          // DO NOT send text to client in voice mode
          socket.emit('avatar-status', { 
            status: 'speaking',
            mode: 'voice'
          });

          try {
            // Generate voice using ElevenLabs
            const audioBuffer = await generateVoice(aiResponse);

            // Send audio data to client
            socket.emit('ai-voice-response', {
              audio: audioBuffer.toString('base64'),
              mode: 'voice',
              timestamp: new Date().toISOString()
              // Note: NO text field here - client should not see text in voice mode
            });

            // Optional: Send hidden transcript for debugging (only if debug mode is enabled)
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
          }

          socket.emit('avatar-status', { status: 'idle', mode: 'voice' });
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
    socket.on('disconnect', (reason) => {
      logger.info(`Client disconnected: ${socket.id}, reason: ${reason}`);
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

  logger.info('Socket.IO initialized successfully');
  
  return io;
};
