import dotenv from 'dotenv';
import { createApp } from './src/app.js';
import { connectDB, getPool } from './src/config/db.js';
import { validateEnv } from './src/config/env.js';

// Load & validate environment variables at startup
dotenv.config();
validateEnv();

// Initialize database connection
connectDB();

// Create configured Express application
const app = createApp();
const port = process.env.PORT || 4000;

const server = app.listen(port, () => {
  console.log(`Express Backend Server listening on http://localhost:${port}`);
});

// Graceful process shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`Received ${signal}. Shutting down HTTP server gracefully...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    try {
      const pool = getPool();
      await pool.end();
      console.log('MySQL Database pool closed.');
    } catch (err) {
      console.error('Error closing DB pool:', err.message);
    }
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
