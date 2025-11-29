import axios from 'axios';

/**
 * HeyGen Service - For Avatar TTS (Text-to-Speech) Output
 * OpenAI handles LLM responses, HeyGen handles avatar animation + voice
 */
class HeyGenService {
  constructor() {
    this.apiKey = process.env.HEYGEN_API_KEY;
    this.baseURL = 'https://api.heygen.com/v1';
    this.avatarId = process.env.HEYGEN_AVATAR_ID;
    this.voiceId = process.env.HEYGEN_VOICE_ID;
    
    if (!this.apiKey) {
      console.warn('⚠️ HEYGEN_API_KEY is not set in environment variables');
    }
  }

  /**
   * Create a new streaming session for the avatar
   */
  async createStreamingSession() {
    try {
      const response = await axios.post(
        `${this.baseURL}/streaming.new`,
        {
          quality: 'high',
          avatar_name: this.avatarId,
          voice: {
            voice_id: this.voiceId,
          },
        },
        {
          headers: {
            'X-Api-Key': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log(`✅ HeyGen session created: ${response.data.data.session_id}`);
      return response.data.data;
    } catch (error) {
      console.error('❌ HeyGen create session error:', error.response?.data || error.message);
      throw new Error(`Failed to create HeyGen session: ${error.message}`);
    }
  }

  /**
   * Start the streaming session
   */
  async startSession(sessionId) {
    try {
      const response = await axios.post(
        `${this.baseURL}/streaming.start`,
        {
          session_id: sessionId,
        },
        {
          headers: {
            'X-Api-Key': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('✅ HeyGen session started');
      return response.data;
    } catch (error) {
      console.error('❌ HeyGen start session error:', error.response?.data || error.message);
      throw new Error(`Failed to start HeyGen session: ${error.message}`);
    }
  }

  /**
   * Make avatar speak the text (TTS)
   * Use this to send OpenAI's response to the avatar
   */
  async speakText(sessionId, text) {
    try {
      const response = await axios.post(
        `${this.baseURL}/streaming.task`,
        {
          session_id: sessionId,
          text: text,
          task_type: 'talk',
        },
        {
          headers: {
            'X-Api-Key': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('✅ Text sent to HeyGen avatar for speaking');
      return response.data;
    } catch (error) {
      console.error('❌ HeyGen speak text error:', error.response?.data || error.message);
      throw new Error(`Failed to send text to HeyGen: ${error.message}`);
    }
  }

  /**
   * Stop the streaming session
   */
  async stopSession(sessionId) {
    try {
      const response = await axios.post(
        `${this.baseURL}/streaming.stop`,
        {
          session_id: sessionId,
        },
        {
          headers: {
            'X-Api-Key': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('✅ HeyGen session stopped');
      return response.data;
    } catch (error) {
      console.error('❌ HeyGen stop session error:', error.response?.data || error.message);
      throw new Error(`Failed to stop HeyGen session: ${error.message}`);
    }
  }

  /**
   * Send ICE candidate for WebRTC connection
   */
  async sendICE(sessionId, candidate) {
    try {
      const response = await axios.post(
        `${this.baseURL}/streaming.ice`,
        {
          session_id: sessionId,
          candidate: candidate,
        },
        {
          headers: {
            'X-Api-Key': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('❌ HeyGen send ICE error:', error.response?.data || error.message);
      throw new Error(`Failed to send ICE to HeyGen: ${error.message}`);
    }
  }

  /**
   * List available avatars
   */
  async listAvatars() {
    try {
      const response = await axios.get(
        `${this.baseURL}/avatar.list`,
        {
          headers: {
            'X-Api-Key': this.apiKey,
          },
        }
      );

      return response.data.data.avatars;
    } catch (error) {
      console.error('❌ HeyGen list avatars error:', error.response?.data || error.message);
      throw new Error(`Failed to list HeyGen avatars: ${error.message}`);
    }
  }

  /**
   * List available voices
   */
  async listVoices() {
    try {
      const response = await axios.get(
        `${this.baseURL}/voice.list`,
        {
          headers: {
            'X-Api-Key': this.apiKey,
          },
        }
      );

      return response.data.data.voices;
    } catch (error) {
      console.error('❌ HeyGen list voices error:', error.response?.data || error.message);
      throw new Error(`Failed to list HeyGen voices: ${error.message}`);
    }
  }
}

export default new HeyGenService();