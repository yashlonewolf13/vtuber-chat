import axios from 'axios';
import { logger } from '../utils/logger.js';

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

/**
 * Generate voice audio from text using ElevenLabs
 * @param {string} text - Text to convert to speech
 * @param {Object} options - Voice generation options
 * @returns {Promise<Buffer>} - Audio buffer
 */
export const generateVoice = async (text, options = {}) => {
  try {
    const {
      voiceId = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL', // Default: Bella voice
      modelId = 'eleven_monolingual_v1',
      stability = 0.5,
      similarityBoost = 0.75,
      style = 0.0,
      useSpeakerBoost = true
    } = options;

    if (!process.env.ELEVENLABS_API_KEY) {
      throw new Error('ElevenLabs API key is not configured');
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    logger.info(`Generating voice for text: "${text.substring(0, 50)}..."`);

    const response = await axios({
      method: 'POST',
      url: `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      },
      data: {
        text,
        model_id: modelId,
        voice_settings: {
          stability,
          similarity_boost: similarityBoost,
          style,
          use_speaker_boost: useSpeakerBoost
        }
      },
      responseType: 'arraybuffer'
    });

    const audioBuffer = Buffer.from(response.data);
    
    logger.info(`Voice generated successfully. Audio size: ${audioBuffer.length} bytes`);
    
    return audioBuffer;

  } catch (error) {
    logger.error('ElevenLabs API error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      throw new Error('Invalid ElevenLabs API key. Please check your configuration.');
    } else if (error.response?.status === 429) {
      throw new Error('ElevenLabs rate limit exceeded. Please try again later.');
    } else if (error.response?.status === 400) {
      throw new Error('Invalid request to ElevenLabs. Check voice ID and parameters.');
    }
    
    throw new Error(`Failed to generate voice: ${error.message}`);
  }
};

/**
 * Get available voices from ElevenLabs
 * @returns {Promise<Array>} - List of available voices
 */
export const getAvailableVoices = async () => {
  try {
    if (!process.env.ELEVENLABS_API_KEY) {
      throw new Error('ElevenLabs API key is not configured');
    }

    const response = await axios({
      method: 'GET',
      url: `${ELEVENLABS_API_URL}/voices`,
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      }
    });

    return response.data.voices;

  } catch (error) {
    logger.error('Error fetching voices:', error);
    throw new Error('Failed to fetch available voices');
  }
};

/**
 * Get voice details
 * @param {string} voiceId - Voice ID
 * @returns {Promise<Object>} - Voice details
 */
export const getVoiceDetails = async (voiceId) => {
  try {
    if (!process.env.ELEVENLABS_API_KEY) {
      throw new Error('ElevenLabs API key is not configured');
    }

    const response = await axios({
      method: 'GET',
      url: `${ELEVENLABS_API_URL}/voices/${voiceId}`,
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      }
    });

    return response.data;

  } catch (error) {
    logger.error('Error fetching voice details:', error);
    throw new Error('Failed to fetch voice details');
  }
};

/**
 * Get user subscription info
 * @returns {Promise<Object>} - Subscription details
 */
export const getSubscriptionInfo = async () => {
  try {
    if (!process.env.ELEVENLABS_API_KEY) {
      throw new Error('ElevenLabs API key is not configured');
    }

    const response = await axios({
      method: 'GET',
      url: `${ELEVENLABS_API_URL}/user/subscription`,
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      }
    });

    return response.data;

  } catch (error) {
    logger.error('Error fetching subscription info:', error);
    throw new Error('Failed to fetch subscription info');
  }
};

export default {
  generateVoice,
  getAvailableVoices,
  getVoiceDetails,
  getSubscriptionInfo
};
