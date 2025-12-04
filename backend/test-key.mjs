import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testKey() {
  const key = process.env.ELEVENLABS_API_KEY;
  
  console.log('Testing key...');
  console.log('Key length:', key?.length);
  console.log('First 20 chars:', key?.substring(0, 20));
  
  try {
    const response = await axios.get(
      'https://api.elevenlabs.io/v1/user/subscription',
      { headers: { 'xi-api-key': key } }
    );
    
    console.log('\n✅ SUCCESS!');
    console.log('Character count:', response.data.character_count);
    console.log('Character limit:', response.data.character_limit);
    console.log('Status:', response.data.status);
    
  } catch (error) {
    console.log('\n❌ FAILED!');
    const errorData = error.response?.data;
    if (Buffer.isBuffer(errorData)) {
      console.log('Error:', errorData.toString());
    } else {
      console.log('Error:', errorData);
    }
  }
}

testKey();
