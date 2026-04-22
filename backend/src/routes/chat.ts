import { Router } from 'express';
import {
  chat,
  streamChat,
  getConversations,
  getConversation,
  deleteConversation,
  regenerateLastResponse,
  clearConversation,
  exportConversation,
} from '../controllers/chatController';
import { authenticate, authenticateWithQueryToken } from '../middleware/auth';
import { chatValidator, validate } from '../middleware/validators';

const router = Router();

router.post('/',        authenticate, chatValidator, validate, chat);
router.get('/stream',   authenticateWithQueryToken, streamChat);

router.get('/conversations',         authenticate, getConversations);
router.get('/conversations/:id',     authenticate, getConversation);
router.delete('/conversations/:id',  authenticate, deleteConversation);
router.post('/conversations/:id/regenerate', authenticate, regenerateLastResponse);
router.post('/conversations/:id/clear',      authenticate, clearConversation);
router.get('/conversations/:id/export',      authenticateWithQueryToken, exportConversation);

export default router;