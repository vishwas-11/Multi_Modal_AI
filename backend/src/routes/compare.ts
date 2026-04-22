import { Router } from 'express';
import { compareMediaItems, batchAnalyze } from '../controllers/compareController';
import { authenticate } from '../middleware/auth';
import { compareValidator, validate } from '../middleware/validators';

const router = Router();

router.use(authenticate);

router.post('/compare', compareValidator, validate, compareMediaItems);
router.post('/batch', authenticate, batchAnalyze);

export default router;