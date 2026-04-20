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
import { authenticate } from '../middleware/auth';
import { chatValidator, validate } from '../middleware/validators';

const router = Router();
router.use(authenticate);

router.post('/',        chatValidator, validate, chat);
router.get('/stream',   streamChat);

router.get('/conversations',         getConversations);
router.get('/conversations/:id',     getConversation);
router.delete('/conversations/:id',  deleteConversation);
router.post('/conversations/:id/regenerate', regenerateLastResponse);
router.post('/conversations/:id/clear',      clearConversation);
router.get('/conversations/:id/export',      exportConversation);

export default router;