import dotenv from 'dotenv';
import { createServer } from 'http';
import app from './app.js';
import { connectDatabase } from './config/database.js';
import { initializeSocket } from './sockets/index.js';
import { logger } from './utils/logger.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO
const io = initializeSocket(httpServer);

// Make io available to app
app.set('io', io);

/**
 * Create necessary directories
 */
const createDirectories = async () => {
  const directories = [
    'uploads/audio',
    'uploads/output',
    'logs'
  ];

  for (const dir of directories) {
    try {
      await fs.mkdir(dir, { recursive: true });
      logger.info(`Directory created/verified: ${dir}`);
    } catch (error) {
      logger.error(`Error creating directory ${dir}:`, error);
    }
  }
};

/**
 * Start the server
 */
const startServer = async () => {
  try {
    // Create directories
    console.log('📁 Creating directories...');
    await createDirectories();

    // Connect to database
    console.log('💾 Connecting to database...');
    await connectDatabase();

    console.log('🌐 Starting HTTP server...');
    // Start HTTP server
    httpServer.listen(PORT, () => {
      logger.info(`
╔════════════════════════════════════════════════╗
║                                                ║
║   AI Avatar Conversation Backend               ║
║                                                ║
║   Environment: ${NODE_ENV.padEnd(31)} ║
║   Port: ${PORT.toString().padEnd(37)} ║
║   Socket.IO: Enabled                           ║
║                                                ║
║   API: http://localhost:${PORT}/api/v1          ${PORT === 5000 ? '    ' : '   '}║
║   Health: http://localhost:${PORT}/health      ${PORT === 5000 ? '    ' : '   '}║
║                                                ║
╚════════════════════════════════════════════════╝
      `);
    });

    // Handle server errors
    httpServer.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use`);
      } else {
        logger.error('Server error:', error);
      }
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

/**
 * Graceful shutdown
 */
const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}, starting graceful shutdown...`);

  // Close HTTP server
  httpServer.close(() => {
    logger.info('HTTP server closed');
  });

  // Close Socket.IO
  io.close(() => {
    logger.info('Socket.IO closed');
  });

  // Give ongoing requests time to complete
  setTimeout(() => {
    logger.info('Forcing shutdown');
    process.exit(0);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
console.log('🚀 About to start server...');
startServer().then(() => {
  console.log('✅ Server started successfully');
}).catch((error) => {
  console.error('❌ Server failed to start:', error);
  process.exit(1);
});