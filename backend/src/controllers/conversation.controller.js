import { generateAIResponse } from '../services/openai.service.js';
import { generateVoice } from '../services/elevenlabs.service.js';
import { logger } from '../utils/logger.js';

/**
 * Handle conversation - get AI response
 */
export const handleConversation = async ({ message, history = [], userId }) => {
  try {
    if (!message || message.trim().length === 0) {
      throw new Error('Message cannot be empty');
    }

    logger.info(`Processing conversation for user ${userId || 'anonymous'}`);

    // Generate AI response using OpenAI
    const aiResponse = await generateAIResponse(message, history, {
      systemPrompt: `You are a friendly AI avatar assistant. Your responses will be either read as text or spoken aloud.
      
Keep your responses:
- Natural and conversational
- Concise (2-3 sentences for simple questions)
- Engaging and personable
- Easy to understand when spoken aloud

Remember: Your response might be spoken by a voice, so write as if you're having a natural conversation.`
    });

    return aiResponse;

  } catch (error) {
    logger.error('Error in handleConversation:', error);
    throw error;
  }
};

/**
 * Handle text-based conversation (REST endpoint)
 */
export const sendTextMessage = async (req, res) => {
  try {
    const { message, history = [], userId } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    const aiResponse = await handleConversation({ message, history, userId });

    res.json({
      success: true,
      data: {
        message: aiResponse,
        mode: 'text',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error in sendTextMessage:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process message'
    });
  }
};

/**
 * Handle voice-based conversation (REST endpoint)
 */
export const sendVoiceMessage = async (req, res) => {
  try {
    const { message, history = [], userId, voiceSettings = {} } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Get AI text response
    const aiResponse = await handleConversation({ message, history, userId });

    // Generate voice from text
    const audioBuffer = await generateVoice(aiResponse, voiceSettings);

    // Send audio as base64
    res.json({
      success: true,
      data: {
        audio: audioBuffer.toString('base64'),
        mode: 'voice',
        timestamp: new Date().toISOString()
        // Note: NO text in voice mode!
      }
    });

  } catch (error) {
    logger.error('Error in sendVoiceMessage:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process voice message'
    });
  }
};

/**
 * Get conversation suggestions
 */
export const getConversationSuggestions = async (req, res) => {
  try {
    const suggestions = [
      "Tell me about yourself",
      "What can you help me with?",
      "How are you today?",
      "Can you tell me a fun fact?",
      "What's your favorite topic to discuss?"
    ];

    res.json({
      success: true,
      data: suggestions
    });

  } catch (error) {
    logger.error('Error in getConversationSuggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get suggestions'
    });
  }
};

export default {
  handleConversation,
  sendTextMessage,
  sendVoiceMessage,
  getConversationSuggestions
};
