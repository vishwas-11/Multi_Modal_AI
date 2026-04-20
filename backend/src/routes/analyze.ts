import { Router } from 'express';
import {
  analyzeImageMedia,
  ocrImageMedia,
  structuredExtractMedia,
  analyzeChartMedia,
  analyzeVideoMedia,
  temporalVideoQA,
  analyzeAudioMedia,
  analyzeDocumentMedia,
  analyzeMultiPageDocument,
} from '../controllers/analyzeController';
import { authenticate } from '../middleware/auth';
import { analyzeValidator, validate } from '../middleware/validators';

const router = Router();
router.use(authenticate);

router.post('/image',     analyzeValidator, validate, analyzeImageMedia);
router.post('/image/ocr', analyzeValidator, validate, ocrImageMedia);
router.post('/image/structured', analyzeValidator, validate, structuredExtractMedia);
router.post('/image/chart',      analyzeValidator, validate, analyzeChartMedia);
router.post('/video',     analyzeValidator, validate, analyzeVideoMedia);
router.post('/video/temporal-qa', analyzeValidator, validate, temporalVideoQA);
router.post('/audio',     analyzeValidator, validate, analyzeAudioMedia);
router.post('/document',  analyzeValidator, validate, analyzeDocumentMedia);
router.post('/document/multipage', authenticate, analyzeMultiPageDocument);

export default router;