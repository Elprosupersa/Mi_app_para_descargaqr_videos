import Redis from 'ioredis';
import { logger } from '../utils/logger';
import dotenv from 'dotenv';
dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisConnection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

redisConnection.on('error', (error) => {
  logger.error('Redis connection error:', error);
});

redisConnection.on('connect', () => {
  logger.info('Connected to Redis successfully');
});
