import { Queue, QueueEvents, Job as BullJob } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database';
import { redisConnection } from '../db/redis';
import { logger } from '../utils/logger';
import { io } from '../server';

export interface JobData {
  id: string;
  url: string;
}

export const mediaQueue = new Queue<JobData, any, string>('mediaQueue', { connection: redisConnection as any });

export const queueEvents = new QueueEvents('mediaQueue', { connection: redisConnection as any });

queueEvents.on('completed', async ({ jobId }) => {
  logger.info(`Global event: Job ${jobId} completed`);
  if (io) {
    io.emit('jobUpdated', queueService.getJob(jobId));
  }
});

queueEvents.on('failed', async ({ jobId }) => {
  logger.info(`Global event: Job ${jobId} failed`);
  if (io) {
    io.emit('jobUpdated', queueService.getJob(jobId));
  }
});

queueEvents.on('progress', async ({ jobId, data }) => {
  // data contains the progress number
  if (io) {
    io.emit('jobUpdated', queueService.getJob(jobId));
  }
});

class QueueService {
  public async enqueue(url: string): Promise<string> {
    const jobId = uuidv4();
    
    // Store initial pending job in SQLite
    const stmt = db.prepare(`
      INSERT INTO jobs (id, url, status, progress) 
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(jobId, url, 'pending', 0);
    logger.info(`Job ${jobId} saved to database for URL: ${url}`);
    
    // Add to BullMQ
    await mediaQueue.add('processMedia', { id: jobId, url }, { jobId });
    logger.info(`Job ${jobId} added to BullMQ`);
    
    // Emit event
    if (io) {
       io.emit('jobAdded', this.getJob(jobId));
    }
    
    return jobId;
  }
  
  public getJob(jobId: string): any {
    const stmt = db.prepare('SELECT * FROM jobs WHERE id = ?');
    const row = stmt.get(jobId) as any;
    if (!row) return undefined;
    
    return {
      id: row.id,
      url: row.url,
      platform: row.platform,
      title: row.title,
      status: row.status,
      progress: row.progress,
      filePath: row.file_path,
      thumbnail: row.thumbnail,
      author: row.author,
      duration: row.duration,
      errorMessage: row.error_message
    };
  }
  
  public getAllJobs(): any[] {
    const stmt = db.prepare('SELECT * FROM jobs ORDER BY created_at DESC');
    const rows = stmt.all() as any[];
    return rows.map(row => ({
      id: row.id,
      url: row.url,
      platform: row.platform,
      title: row.title,
      status: row.status,
      progress: row.progress,
      filePath: row.file_path,
      thumbnail: row.thumbnail,
      author: row.author,
      duration: row.duration,
      errorMessage: row.error_message
    }));
  }

  public updateJobStatus(id: string, updates: Partial<any>) {
    const setClause = [];
    const values = [];
    
    if (updates.status) { setClause.push('status = ?'); values.push(updates.status); }
    if (updates.progress !== undefined) { setClause.push('progress = ?'); values.push(updates.progress); }
    if (updates.filePath) { setClause.push('file_path = ?'); values.push(updates.filePath); }
    if (updates.title) { setClause.push('title = ?'); values.push(updates.title); }
    if (updates.platform) { setClause.push('platform = ?'); values.push(updates.platform); }
    if (updates.thumbnail) { setClause.push('thumbnail = ?'); values.push(updates.thumbnail); }
    if (updates.author) { setClause.push('author = ?'); values.push(updates.author); }
    if (updates.duration) { setClause.push('duration = ?'); values.push(updates.duration); }
    if (updates.errorMessage) { setClause.push('error_message = ?'); values.push(updates.errorMessage); }
    
    setClause.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    if (setClause.length === 1) return; // Only updated_at

    const stmt = db.prepare(`UPDATE jobs SET ${setClause.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    // If we are in the main Express process, emit local updates.
    // If we are in the worker process, this io.emit does nothing useful,
    // but the QueueEvents will catch the global events and emit them in the main process.
    if (io) {
       io.emit('jobUpdated', this.getJob(id));
    }
  }

  public emitLog(jobId: string, log: string) {
    // Note: Since this is called from the worker process, the local io object is disconnected
    // from the real clients. To ensure logs reach the frontend across Docker containers,
    // we use a quick Redis pub/sub mechanism specifically for logs.
    if (io) {
       // In worker, we publish the log to Redis
       redisConnection.publish('worker_logs', JSON.stringify({ jobId, log }));
       // Also emit locally just in case
       io.to(`job:${jobId}`).emit('jobLog', { jobId, log });
    }
  }
}

export const queueService = new QueueService();

// Subscribe to worker logs in the main Express process to broadcast them via socket.io
const logSubscriber = redisConnection.duplicate();
logSubscriber.subscribe('worker_logs');
logSubscriber.on('message', (channel, message) => {
  if (channel === 'worker_logs' && io) {
    try {
      const { jobId, log } = JSON.parse(message);
      io.emit('jobLog', { jobId, log }); // Emitting globally for simplicity in the UI
    } catch (e) {}
  }
});
