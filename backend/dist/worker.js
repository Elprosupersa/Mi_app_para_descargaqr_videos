"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bullmq_1 = require("bullmq");
const redis_1 = require("./db/redis");
const media_service_1 = require("./services/media.service");
const queue_service_1 = require("./services/queue.service");
const logger_1 = require("./utils/logger");
const database_1 = require("./db/database");
(0, database_1.initDb)();
const worker = new bullmq_1.Worker('mediaQueue', async (job) => {
    const { id, url } = job.data;
    logger_1.logger.info(`Worker starting job ${id} for URL: ${url}`);
    queue_service_1.queueService.updateJobStatus(id, { status: 'downloading', progress: 5 });
    queue_service_1.queueService.emitLog(id, `[WORKER] Starting job ${id} for URL: ${url}`);
    try {
        queue_service_1.queueService.emitLog(id, `[WORKER] Extracting metadata...`);
        const metadata = await (0, media_service_1.extractMetadata)(url);
        queue_service_1.queueService.updateJobStatus(id, {
            title: metadata.title,
            platform: metadata.platform,
            thumbnail: metadata.thumbnail,
            author: metadata.author,
            duration: metadata.duration,
            progress: 10
        });
        queue_service_1.queueService.emitLog(id, `[WORKER] Metadata extracted: ${metadata.title} (${metadata.platform})`);
        // Download media
        queue_service_1.queueService.emitLog(id, `[WORKER] Starting download...`);
        const filePath = await (0, media_service_1.downloadMedia)(url, id, (progress) => {
            const scaledProgress = 10 + Math.floor(progress * 0.89);
            queue_service_1.queueService.updateJobStatus(id, { progress: scaledProgress });
        }, (log) => {
            queue_service_1.queueService.emitLog(id, log);
        });
        queue_service_1.queueService.updateJobStatus(id, {
            status: 'completed',
            progress: 100,
            filePath: filePath
        });
        queue_service_1.queueService.emitLog(id, `[WORKER] Job ${id} completed successfully! File saved to ${filePath}`);
        logger_1.logger.info(`Job ${id} completed successfully.`);
    }
    catch (err) {
        logger_1.logger.error(`Job ${id} failed`, err);
        queue_service_1.queueService.emitLog(id, `[WORKER] ERROR: ${err.message}`);
        queue_service_1.queueService.updateJobStatus(id, {
            status: 'error',
            errorMessage: err.message || 'Unknown error occurred'
        });
        throw err; // Re-throw to let BullMQ know it failed (for retries)
    }
}, {
    connection: redis_1.redisConnection,
    concurrency: 3, // Process up to 3 downloads concurrently
    limiter: {
        max: 10,
        duration: 1000,
    }
});
worker.on('failed', (job, err) => {
    logger_1.logger.error(`Job ${job?.id} has failed with ${err.message}`);
});
logger_1.logger.info('Worker started and listening to mediaQueue');
