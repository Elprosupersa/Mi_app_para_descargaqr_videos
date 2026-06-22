import { Request, Response } from 'express';
import { z } from 'zod';
import { queueService } from '../services/queue.service';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs';

const ALLOWED_DOMAINS = process.env.ALLOWED_DOMAINS 
  ? process.env.ALLOWED_DOMAINS.split(',') 
  : ['youtube.com', 'youtu.be', 'tiktok.com', 'instagram.com'];

const isAllowedDomain = (url: string) => {
  try {
    const parsed = new URL(url);
    // Basic SSRF protection (prevent local IPs)
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1' || parsed.hostname.startsWith('192.168.') || parsed.hostname.startsWith('10.')) {
      return false;
    }
    // Check against allowed domains
    return ALLOWED_DOMAINS.some(d => parsed.hostname.endsWith(d));
  } catch {
    return false;
  }
};

const processSchema = z.object({
  url: z.string().url('Invalid URL format.').refine(isAllowedDomain, {
    message: 'URL domain is not supported or not allowed.'
  }),
});

export const processMedia = (req: Request, res: Response): void => {
  try {
    const parseResult = processSchema.safeParse(req.body);
    
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.issues[0].message,
      });
      return;
    }

    const sessionId = req.headers['x-session-id'] as string;
    if (!sessionId) {
      res.status(401).json({ success: false, message: 'Session ID is required.' });
      return;
    }

    const { url } = parseResult.data;
    const jobId = queueService.enqueue(url, sessionId);

    res.json({
      success: true,
      jobId,
      message: 'Job queued successfully'
    });
  } catch (error: any) {
    logger.error('Error in processMedia:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error processing request.',
    });
  }
};

export const getJobStatus = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const job = queueService.getJob(id as string);
    
    if (!job) {
      res.status(404).json({ success: false, message: 'Job not found' });
      return;
    }
    
    res.json({ success: true, data: job });
  } catch (error: any) {
    logger.error('Error in getJobStatus:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getHistory = (req: Request, res: Response): void => {
  try {
    const sessionId = req.headers['x-session-id'] as string;
    if (!sessionId) {
      res.status(401).json({ success: false, message: 'Session ID is required.' });
      return;
    }

    const jobs = queueService.getJobsBySession(sessionId);
    res.json({ success: true, data: jobs });
  } catch (error: any) {
    logger.error('Error in getHistory:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const downloadFile = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const job = queueService.getJob(id as string);
    
    if (!job || job.status !== 'completed' || !job.filePath) {
      res.status(404).json({ success: false, message: 'File not available' });
      return;
    }
    
    if (!fs.existsSync(job.filePath)) {
       res.status(404).json({ success: false, message: 'File missing on disk' });
       return;
    }
    
    res.download(job.filePath);
  } catch (error: any) {
    logger.error('Error in downloadFile:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
