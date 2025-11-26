console.log('1. Starting...');

import dotenv from 'dotenv';
console.log('2. Dotenv imported');

import path from 'path';
import { fileURLToPath } from 'url';
console.log('3. Path imported');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

console.log('4. Dotenv configured');
console.log('   PORT:', process.env.PORT);
console.log('   OPENAI_KEY exists:', !!process.env.OPENAI_API_KEY);

import express from 'express';
console.log('5. Express imported');

const app = express();
const PORT = process.env.PORT || 5000;

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║   ✅ MINIMAL SERVER RUNNING!                   ║
║   Port: ${PORT}                                ║
╚════════════════════════════════════════════════╝
  `);
});
