"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisConnection = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = require("../utils/logger");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
exports.redisConnection = new ioredis_1.default(redisUrl, {
    maxRetriesPerRequest: null,
});
exports.redisConnection.on('error', (error) => {
    logger_1.logger.error('Redis connection error:', error);
});
exports.redisConnection.on('connect', () => {
    logger_1.logger.info('Connected to Redis successfully');
});
