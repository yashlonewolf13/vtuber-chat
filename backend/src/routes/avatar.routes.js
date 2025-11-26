import express from 'express';
import {
  getAvailableVoices,
  getVoiceDetails,
  getSubscriptionInfo
} from '../services/elevenlabs.service.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/v1/avatar/voices
 * Get all available ElevenLabs voices
 */
router.get('/voices', async (req, res) => {
  try {
    const voices = await getAvailableVoices();
    
    res.json({
      success: true,
      data: voices
    });

  } catch (error) {
    logger.error('Error fetching voices:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch voices'
    });
  }
});

/**
 * GET /api/v1/avatar/voices/:voiceId
 * Get details of a specific voice
 */
router.get('/voices/:voiceId', async (req, res) => {
  try {
    const { voiceId } = req.params;
    const voiceDetails = await getVoiceDetails(voiceId);
    
    res.json({
      success: true,
      data: voiceDetails
    });

  } catch (error) {
    logger.error('Error fetching voice details:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch voice details'
    });
  }
});

/**
 * GET /api/v1/avatar/subscription
 * Get ElevenLabs subscription info
 */
router.get('/subscription', async (req, res) => {
  try {
    const subscriptionInfo = await getSubscriptionInfo();
    
    res.json({
      success: true,
      data: subscriptionInfo
    });

  } catch (error) {
    logger.error('Error fetching subscription info:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch subscription info'
    });
  }
});

/**
 * GET /api/v1/avatar/settings
 * Get current avatar settings
 */
router.get('/settings', async (req, res) => {
  try {
    const settings = {
      defaultVoiceId: process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL',
      defaultMode: 'text',
      voiceSettings: {
        stability: 0.5,
        similarityBoost: 0.75,
        style: 0.0,
        useSpeakerBoost: true
      }
    };

    res.json({
      success: true,
      data: settings
    });

  } catch (error) {
    logger.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch settings'
    });
  }
});

export default router;
