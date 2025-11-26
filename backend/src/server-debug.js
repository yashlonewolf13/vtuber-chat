console.log('=== FILE STARTING ===');

import dotenv from 'dotenv';
console.log('=== DOTENV IMPORTED ===');

dotenv.config();
console.log('=== DOTENV CONFIGURED ===');
console.log('PORT:', process.env.PORT);

import { createServer } from 'http';
console.log('=== HTTP IMPORTED ===');

console.log('=== ALL IMPORTS COMPLETE ===');
