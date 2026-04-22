import { Router } from 'express';
import { uploadMedia, uploadClipboardImage, listMedia, getMediaById, deleteMedia } from '../controllers/uploadController';
import { authenticate } from '../middleware/auth';
import { upload } from '../config/multer';
import { validateUploadedFiles } from '../middleware/fileValidator';

const router = Router();
router.use(authenticate);

router.post('/',          upload.array('files', 10), validateUploadedFiles, uploadMedia);
router.post('/single',    upload.single('file'),     validateUploadedFiles, uploadMedia);
router.post('/clipboard', uploadClipboardImage);

router.get('/',     listMedia);
router.get('/:id',  getMediaById);
router.delete('/:id', deleteMedia);

export default router;