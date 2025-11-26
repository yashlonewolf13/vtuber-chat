import OpenAI from 'openai';
import { logger } from '../utils/logger.js';

let openai = null;

const getopenAIClient = () => {
  if(!openai) {
    if(!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is missing');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return openai
}

/**
 * Generate AI response using OpenAI
 * @param {string} userMessage - The user's message
 * @param {Array} conversationHistory - Previous conversation history
 * @param {Object} options - Additional options
 * @returns {Promise<string>} - AI generated response
 */
export const generateAIResponse = async (userMessage, conversationHistory = [], options = {}) => {
  try {
    const {
      model = 'gpt-4o',
      temperature = 0.7,
      maxTokens = 500,
      systemPrompt = 'You are a helpful and friendly AI avatar assistant. Keep your responses natural, engaging, and conversational. Respond in a way that works well when spoken aloud.'
    } = options;

    // Format conversation history for OpenAI
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      }
    ];

    // Add conversation history (limit to last 10 messages to stay within token limits)
    const recentHistory = conversationHistory.slice(-10);
    messages.push(...recentHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    })));

    // Add current user message
    messages.push({
      role: 'user',
      content: userMessage
    });

    logger.info('Sending request to OpenAI...');

    // Call OpenAI API
    const completion = await getopenAIClient().chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      presence_penalty: 0.6,
      frequency_penalty: 0.3
    });

    const aiResponse = completion.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from OpenAI');
    }

    logger.info(`OpenAI response generated: ${aiResponse.substring(0, 100)}...`);

    return aiResponse.trim();

  } catch (error) {
    logger.error('OpenAI API error:', error);
    
    if (error.code === 'insufficient_quota') {
      throw new Error('OpenAI API quota exceeded. Please check your billing details.');
    } else if (error.code === 'invalid_api_key') {
      throw new Error('Invalid OpenAI API key. Please check your configuration.');
    } else if (error.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    }
    
    throw new Error(`Failed to generate AI response: ${error.message}`);
  }
};

/**
 * Generate streaming AI response (for future use)
 * @param {string} userMessage - The user's message
 * @param {Array} conversationHistory - Previous conversation history
 * @param {Function} onChunk - Callback for each chunk
 * @param {Object} options - Additional options
 */
export const generateStreamingAIResponse = async (
  userMessage,
  conversationHistory = [],
  onChunk,
  options = {}
) => {
  try {
    const {
      model = 'gpt-4o',
      temperature = 0.7,
      maxTokens = 500,
      systemPrompt = 'You are a helpful and friendly AI avatar assistant.'
    } = options;

    const messages = [
      {
        role: 'system',
        content: systemPrompt
      }
    ];

    const recentHistory = conversationHistory.slice(-10);
    messages.push(...recentHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    })));

    messages.push({
      role: 'user',
      content: userMessage
    });

    const stream = await getopenAIClient().chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true
    });

    let fullResponse = '';

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        onChunk(content, fullResponse);
      }
    }

    return fullResponse;

  } catch (error) {
    logger.error('OpenAI streaming error:', error);
    throw new Error(`Failed to generate streaming response: ${error.message}`);
  }
};

export default {
  generateAIResponse,
  generateStreamingAIResponse
};
