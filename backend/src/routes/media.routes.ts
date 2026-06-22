import { Router } from 'express';
import { processMedia, getJobStatus, getHistory, downloadFile } from '../controllers/media.controller';

const router = Router();

router.post('/process', processMedia);
router.get('/status/:id', getJobStatus);
router.get('/history', getHistory);
router.get('/download/:id', downloadFile);

export default router;
