import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';

import mediaRoutes from './routes/media.routes';
import { initDb } from './db/database';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Socket.io setup
export const io = new Server(httpServer, {
  cors: {
    origin: '*',
  }
});

const PORT = process.env.PORT || 3000;

// Initialize Database
initDb();

// Trust proxy (required for Nginx rate limiting)
app.set('trust proxy', 1);

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Routes
app.get('/api/health', (req: express.Request, res: express.Response) => {
  res.status(200).json({ status: 'ok', message: 'Backend is healthy' });
});
app.use('/api/media', mediaRoutes);

// Serve static frontend in production
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

// SPA fallback ONLY for frontend navigation, excluding API routes
app.get(/.*/, (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.path.startsWith('/api')) {
    // Let API 404s fall through to error handling rather than serving the HTML app
    return next();
  }
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Error Handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled server error', err);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

httpServer.listen(Number(PORT), '0.0.0.0', () => {
  logger.info(`🚀 Server running on 0.0.0.0:${PORT}`);
});
