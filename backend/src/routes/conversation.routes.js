import express from 'express';
import {
  sendTextMessage,
  sendVoiceMessage,
  getConversationSuggestions
} from '../controllers/conversation.controller.js';

const router = express.Router();

/**
 * POST /api/v1/conversation/text
 * Send a text message and get text response
 */
router.post('/text', sendTextMessage);

/**
 * POST /api/v1/conversation/voice
 * Send a message and get voice response (audio only, no text)
 */
router.post('/voice', sendVoiceMessage);

/**
 * GET /api/v1/conversation/suggestions
 * Get conversation starter suggestions
 */
router.get('/suggestions', getConversationSuggestions);

export default router;
