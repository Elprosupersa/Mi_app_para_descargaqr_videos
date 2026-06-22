"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueService = exports.mediaQueue = void 0;
const bullmq_1 = require("bullmq");
const uuid_1 = require("uuid");
const database_1 = require("../db/database");
const redis_1 = require("../db/redis");
const logger_1 = require("../utils/logger");
const server_1 = require("../server");
exports.mediaQueue = new bullmq_1.Queue('mediaQueue', { connection: redis_1.redisConnection });
class QueueService {
    async enqueue(url) {
        const jobId = (0, uuid_1.v4)();
        // Store initial pending job in SQLite
        const stmt = database_1.db.prepare(`
      INSERT INTO jobs (id, url, status, progress) 
      VALUES (?, ?, ?, ?)
    `);
        stmt.run(jobId, url, 'pending', 0);
        logger_1.logger.info(`Job ${jobId} saved to database for URL: ${url}`);
        // Add to BullMQ
        await exports.mediaQueue.add('processMedia', { id: jobId, url }, { jobId });
        logger_1.logger.info(`Job ${jobId} added to BullMQ`);
        // Emit event
        if (server_1.io) {
            server_1.io.emit('jobAdded', this.getJob(jobId));
        }
        return jobId;
    }
    getJob(jobId) {
        const stmt = database_1.db.prepare('SELECT * FROM jobs WHERE id = ?');
        const row = stmt.get(jobId);
        if (!row)
            return undefined;
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
    getAllJobs() {
        const stmt = database_1.db.prepare('SELECT * FROM jobs ORDER BY created_at DESC');
        const rows = stmt.all();
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
    updateJobStatus(id, updates) {
        const setClause = [];
        const values = [];
        if (updates.status) {
            setClause.push('status = ?');
            values.push(updates.status);
        }
        if (updates.progress !== undefined) {
            setClause.push('progress = ?');
            values.push(updates.progress);
        }
        if (updates.filePath) {
            setClause.push('file_path = ?');
            values.push(updates.filePath);
        }
        if (updates.title) {
            setClause.push('title = ?');
            values.push(updates.title);
        }
        if (updates.platform) {
            setClause.push('platform = ?');
            values.push(updates.platform);
        }
        if (updates.thumbnail) {
            setClause.push('thumbnail = ?');
            values.push(updates.thumbnail);
        }
        if (updates.author) {
            setClause.push('author = ?');
            values.push(updates.author);
        }
        if (updates.duration) {
            setClause.push('duration = ?');
            values.push(updates.duration);
        }
        if (updates.errorMessage) {
            setClause.push('error_message = ?');
            values.push(updates.errorMessage);
        }
        setClause.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);
        if (setClause.length === 1)
            return; // Only updated_at
        const stmt = database_1.db.prepare(`UPDATE jobs SET ${setClause.join(', ')} WHERE id = ?`);
        stmt.run(...values);
        // Emit live update
        if (server_1.io) {
            server_1.io.emit('jobUpdated', this.getJob(id));
        }
    }
    // Not strictly needed in QueueService anymore, but kept for Socket emits
    emitLog(jobId, log) {
        if (server_1.io) {
            server_1.io.to(`job:${jobId}`).emit('jobLog', { jobId, log });
        }
    }
}
exports.queueService = new QueueService();
