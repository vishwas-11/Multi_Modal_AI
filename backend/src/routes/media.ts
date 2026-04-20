import { Router } from 'express';
import { getSessionGallery, getWaveformData, triggerCleanup } from '../controllers/mediaController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/gallery',        getSessionGallery);
router.get('/:id/waveform',   getWaveformData);
router.post('/cleanup',       triggerCleanup);

export default router;