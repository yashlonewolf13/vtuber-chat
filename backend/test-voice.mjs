import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

async function testVoice() {
  const key = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
  
  console.log('Testing voice generation...');
  console.log('Voice ID:', voiceId);
  
  try {
    const response = await axios({
      method: 'POST',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': key
      },
      data: {
        text: 'Hello! This is a test.',
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      },
      responseType: 'arraybuffer'
    });
    
    console.log('✅ SUCCESS! Voice generated!');
    console.log('Audio size:', response.data.length, 'bytes');
    
    // Save to file
    fs.writeFileSync('test-audio.mp3', response.data);
    console.log('Saved to test-audio.mp3');
    
  } catch (error) {
    console.log('❌ FAILED!');
    if (error.response?.data) {
      const errorData = Buffer.from(error.response.data).toString();
      console.log('Error:', errorData);
    } else {
      console.log('Error:', error.message);
    }
  }
}

testVoice();
