"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadFile = exports.getHistory = exports.getJobStatus = exports.processMedia = void 0;
const zod_1 = require("zod");
const queue_service_1 = require("../services/queue.service");
const logger_1 = require("../utils/logger");
const fs_1 = __importDefault(require("fs"));
const ALLOWED_DOMAINS = process.env.ALLOWED_DOMAINS
    ? process.env.ALLOWED_DOMAINS.split(',')
    : ['youtube.com', 'youtu.be', 'tiktok.com', 'instagram.com'];
const isAllowedDomain = (url) => {
    try {
        const parsed = new URL(url);
        // Basic SSRF protection (prevent local IPs)
        if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1' || parsed.hostname.startsWith('192.168.') || parsed.hostname.startsWith('10.')) {
            return false;
        }
        // Check against allowed domains
        return ALLOWED_DOMAINS.some(d => parsed.hostname.endsWith(d));
    }
    catch {
        return false;
    }
};
const processSchema = zod_1.z.object({
    url: zod_1.z.string().url('Invalid URL format.').refine(isAllowedDomain, {
        message: 'URL domain is not supported or not allowed.'
    }),
});
const processMedia = (req, res) => {
    try {
        const parseResult = processSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                success: false,
                message: parseResult.error.issues[0].message,
            });
            return;
        }
        const { url } = parseResult.data;
        const jobId = queue_service_1.queueService.enqueue(url);
        res.json({
            success: true,
            jobId,
            message: 'Job queued successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error in processMedia:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error processing request.',
        });
    }
};
exports.processMedia = processMedia;
const getJobStatus = (req, res) => {
    try {
        const { id } = req.params;
        const job = queue_service_1.queueService.getJob(id);
        if (!job) {
            res.status(404).json({ success: false, message: 'Job not found' });
            return;
        }
        res.json({ success: true, data: job });
    }
    catch (error) {
        logger_1.logger.error('Error in getJobStatus:', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.getJobStatus = getJobStatus;
const getHistory = (req, res) => {
    try {
        const jobs = queue_service_1.queueService.getAllJobs();
        res.json({ success: true, data: jobs });
    }
    catch (error) {
        logger_1.logger.error('Error in getHistory:', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.getHistory = getHistory;
const downloadFile = (req, res) => {
    try {
        const { id } = req.params;
        const job = queue_service_1.queueService.getJob(id);
        if (!job || job.status !== 'completed' || !job.filePath) {
            res.status(404).json({ success: false, message: 'File not available' });
            return;
        }
        if (!fs_1.default.existsSync(job.filePath)) {
            res.status(404).json({ success: false, message: 'File missing on disk' });
            return;
        }
        res.download(job.filePath);
    }
    catch (error) {
        logger_1.logger.error('Error in downloadFile:', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.downloadFile = downloadFile;
