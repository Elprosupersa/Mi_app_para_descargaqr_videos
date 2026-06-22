import { Worker, Job } from 'bullmq';
import path from 'path';
import { redisConnection } from './db/redis';
import { extractMetadata, downloadMedia } from './services/media.service';
import { queueService } from './services/queue.service';
import { logger } from './utils/logger';
import { initDb } from './db/database';

initDb();

const worker = new Worker('mediaQueue', async (job: Job) => {
  const { id, url } = job.data;
  
  logger.info(`Worker starting job ${id} for URL: ${url}`);
  queueService.updateJobStatus(id, { status: 'downloading', progress: 5 });
  await job.updateProgress(5);
  queueService.emitLog(id, `[WORKER] Starting job ${id} for URL: ${url}`);
  
  try {
    queueService.emitLog(id, `[WORKER] Extracting metadata...`);
    const metadata = await extractMetadata(url);
    queueService.updateJobStatus(id, { 
      title: metadata.title,
      platform: metadata.platform,
      thumbnail: metadata.thumbnail,
      author: metadata.author,
      duration: metadata.duration,
      progress: 10
    });
    await job.updateProgress(10);
    queueService.emitLog(id, `[WORKER] Metadata extracted: ${metadata.title} (${metadata.platform})`);
    
    // Download media
    queueService.emitLog(id, `[WORKER] Starting download...`);
    const filePath = await downloadMedia(url, id, async (progress) => {
       const scaledProgress = 10 + Math.floor(progress * 0.89);
       queueService.updateJobStatus(id, { progress: scaledProgress });
       await job.updateProgress(scaledProgress);
    }, (log) => {
       queueService.emitLog(id, log);
    });
    
    const relativeFilePath = `/downloads/${path.basename(filePath)}`;
    
    queueService.updateJobStatus(id, { 
      status: 'completed', 
      progress: 100, 
      filePath: relativeFilePath 
    });
    await job.updateProgress(100);
    queueService.emitLog(id, `[WORKER] Job ${id} completed successfully! File saved to ${relativeFilePath}`);
    logger.info(`Job ${id} completed successfully.`);
    
  } catch (err: any) {
    logger.error(`Job ${id} failed`, err);
    queueService.emitLog(id, `[WORKER] ERROR: ${err.message}`);
    queueService.updateJobStatus(id, { 
      status: 'error', 
      errorMessage: err.message || 'Unknown error occurred'
    });
    throw err; // Re-throw to let BullMQ know it failed (for retries)
  }
}, { 
  connection: redisConnection as any,
  concurrency: 10, // Increased concurrency to handle multiple users
  limiter: {
    max: 10,
    duration: 1000,
  }
});

// Explicit event listeners for better debugging
worker.on('ready', () => {
  console.log('Worker connected successfully to Redis and is ready.');
});

worker.on('active', (job) => {
  console.log(`Worker active: Job ${job.id} started.`);
});

worker.on('completed', (job) => {
  console.log(`Worker completed: Job ${job.id} finished successfully.`);
});

worker.on('failed', (job, err) => {
  console.error(`Worker failed: Job ${job?.id} encountered an error:`, err);
  logger.error(`Job ${job?.id} has failed with ${err.message}`);
});

worker.on('error', (err) => {
  console.error(`Worker connection error:`, err);
});

console.log('Worker is running and listening to Redis...');
logger.info('Worker started and listening to mediaQueue');
