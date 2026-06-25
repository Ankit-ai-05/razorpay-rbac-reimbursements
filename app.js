'use strict';

require('dotenv').config();

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const routes = require('./src/routes');
const errorHandler = require('./src/middleware/errorHandler');
const logger = require('./src/utils/logger');
const { sendError } = require('./src/utils/response');

const app = express();

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet());

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
    credentials: true, // Required for cookies
  })
);

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', message: 'Too many requests, please try again later.' },
});
app.use(limiter);

// ─── Parsers ──────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' })); // Prevent body-size attacks
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// ─── Logging ──────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'success', data: { service: 'Reimbursements API', uptime: process.uptime() } });
});

app.get('/', (req, res) => {
  res.json({ status: 'success', message: 'Reimbursements API is running. See /rest for API endpoints.' });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/rest', routes);

// ─── Serve Frontend ───────────────────────────────────────────────────────────
// Serve static files from the React frontend app
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// Anything that doesn't match the API routes should return the React index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

// ─── Global Error Handler (must be LAST) ─────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT, 10) || 3000;

const startServer = async () => {
  try {
    const { sequelize } = require('./src/models');
    await sequelize.authenticate();
    logger.info('✅  Database connection established successfully');

    const server = app.listen(PORT, () => {
      logger.info(`🚀  Server running on http://localhost:${PORT}`);
      logger.info(`📄  Environment: ${process.env.NODE_ENV}`);
    });

    // Graceful shutdown
    const shutdown = (signal) => {
      logger.info(`${signal} received — shutting down gracefully...`);
      server.close(async () => {
        await sequelize.close();
        logger.info('Database connection closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (err) {
    logger.error('❌  Failed to start server:', err);
    process.exit(1);
  }
};

startServer();

module.exports = app; // Export for testing
