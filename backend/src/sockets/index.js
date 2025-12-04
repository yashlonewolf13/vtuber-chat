import { Server } from 'socket.io';
import { logger } from '../utils/logger.js';
import { handleConversation } from '../controllers/conversation.controller.js';
import { generateVoice } from '../services/elevenlabs.service.js';

export function initializeSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Initialize socket data
    socket.data.conversationMode = 'text';
    socket.data.avatarActive = false;

    // ========================================
    // AVATAR CONTROL EVENTS (Simplified)
    // ========================================

    // Start Avatar
    socket.on('start-avatar', async () => {
      try {
        logger.info(`🎬 Starting avatar for socket: ${socket.id}`);
        
        socket.data.avatarActive = true;
        
        // Emit success
        socket.emit('avatar-started');
        
        logger.info(`✅ Avatar started for socket: ${socket.id}`);
        
      } catch (error) {
        logger.error(`❌ Error starting avatar: ${error.message}`);
        socket.emit('avatar-error', { error: error.message });
      }
    });

    // Stop Avatar
    socket.on('stop-avatar', async () => {
      try {
        logger.info(`🛑 Stopping avatar for socket: ${socket.id}`);
        
        socket.data.avatarActive = false;
        
        // Emit success
        socket.emit('avatar-stopped');
        
        logger.info(`✅ Avatar stopped for socket: ${socket.id}`);
        
      } catch (error) {
        logger.error(`❌ Error stopping avatar: ${error.message}`);
        socket.emit('avatar-error', { error: error.message });
      }
    });

    // ========================================
    // CONVERSATION MODE
    // ========================================

    socket.on('set-mode', ({ mode }) => {
      logger.info(`🔄 Mode changed to: ${mode}`);
      socket.data.conversationMode = mode;
      socket.emit('mode-changed', { mode });
    });

    // ========================================
    // TEXT MESSAGE HANDLER
    // ========================================

    socket.on('send-message', async ({ message, userId }) => {
      try {
        logger.info(`Processing text message from ${socket.id}: ${message.substring(0, 50)}...`);

        const mode = socket.data.conversationMode || 'text';
        const avatarActive = socket.data.avatarActive || false;

        // Update avatar status
        socket.emit('avatar-status', { status: 'thinking', mode });

        // Get AI response from OpenAI
        const aiResponseData = await handleConversation ({
          message, 
          history: [], 
          userId: userId || 'anonymous'
        });

        const aiResponse = typeof aiResponseData === 'string'
        ? aiResponseData
        : aiResponseData;

        logger.info('AI Response type: ${typeof aiResponse}');
        logger.info('AI Response value: ${aiResponse}');

        if (mode === 'text') {
          // TEXT MODE: Just send text response
          socket.emit('ai-response', {
            message: aiResponse,
            mode: 'text',
            timestamp: new Date().toISOString(),
          });
          socket.emit('avatar-status', { status: 'idle', mode });

        } else if (mode === 'speech') {
          // SPEECH MODE: Generate voice with ElevenLabs
          
          if (avatarActive) {
            // Avatar is active - generate speech
            socket.emit('avatar-status', { status: 'speaking', mode });

            try {
              // Generate audio with ElevenLabs
              logger.info('Sending to ElevenLabs: "${aiResponse.substring(0,50)}..."');
              const audioBuffer = await generateVoice(aiResponse);
              
              // Send audio response
              socket.emit('ai-voice-response', {
                audio: audioBuffer.toString('base64'),
                message: aiResponse, // Also send text
                mode: 'speech',
                source: 'elevenlabs',
                timestamp: new Date().toISOString(),
              });

              // Estimate speaking duration (roughly 50ms per character)
              const estimatedDuration = aiResponse.length * 50;
              
              // Auto-return to idle after speaking
              setTimeout(() => {
                socket.emit('avatar-status', { status: 'idle', mode });
              }, estimatedDuration);

            } catch (voiceError) {
              logger.error(`Error generating voice: ${voiceError.message}`);
              
              // Fallback to text if voice generation fails
              socket.emit('ai-response', {
                message: aiResponse,
                mode: 'text',
                timestamp: new Date().toISOString(),
              });
              socket.emit('avatar-status', { status: 'idle', mode });
            }

          } else {
            // Avatar not active - just send text
            socket.emit('ai-response', {
              message: aiResponse,
              mode: 'text',
              timestamp: new Date().toISOString(),
            });
            socket.emit('avatar-status', { status: 'idle', mode });
          }
        }

      } catch (error) {
        logger.error(`Error processing message: ${error.message}`);
        socket.emit('error', { message: 'Failed to process your message. Please try again.' });
        socket.emit('avatar-status', { status: 'idle', mode: socket.data.conversationMode });
      }
    });

    // ========================================
    // VOICE MESSAGE HANDLER (Optional)
    // ========================================

    socket.on('send-voice-message', async ({ audio, userId }) => {
      try {
        logger.info(`Processing voice message from ${socket.id}`);

        const mode = socket.data.conversationMode || 'speech';
        const avatarActive = socket.data.avatarActive || false;

        socket.emit('avatar-status', { status: 'thinking', mode });

        // Note: You'd need to add voice transcription here
        // For now, just send a placeholder response
        const aiResponse = "Voice message received. Please implement transcription.";

        if (avatarActive) {
          socket.emit('avatar-status', { status: 'speaking', mode });

          try {
            const audioBuffer = await generateVoice(aiResponse);
            
            socket.emit('ai-voice-response', {
              audio: audioBuffer.toString('base64'),
              message: aiResponse,
              mode: 'speech',
              source: 'elevenlabs',
              timestamp: new Date().toISOString(),
            });

            setTimeout(() => {
              socket.emit('avatar-status', { status: 'idle', mode });
            }, aiResponse.length * 50);

          } catch (error) {
            logger.error(`Error generating voice: ${error.message}`);
            socket.emit('avatar-status', { status: 'idle', mode });
          }
        } else {
          socket.emit('ai-response', {
            message: aiResponse,
            mode: 'text',
            timestamp: new Date().toISOString(),
          });
          socket.emit('avatar-status', { status: 'idle', mode });
        }

      } catch (error) {
        logger.error(`Error processing voice message: ${error.message}`);
        socket.emit('error', { message: 'Failed to process voice message.' });
        socket.emit('avatar-status', { status: 'idle', mode: socket.data.conversationMode });
      }
    });

    // ========================================
    // UTILITY EVENTS
    // ========================================

    socket.on('clear-conversation', () => {
      logger.info(`Clearing conversation for socket: ${socket.id}`);
      socket.emit('conversation-cleared');
    });

    socket.on('get-history', () => {
      // Return empty history for now
      socket.emit('conversation-history', { messages: [] });
    });

    // ========================================
    // DISCONNECT
    // ========================================

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
      socket.data.avatarActive = false;
    });
  });

  logger.info('✅ Socket.IO initialized successfully (ElevenLabs mode)');
  return io;
}
