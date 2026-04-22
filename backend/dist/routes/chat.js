"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chatController_1 = require("../controllers/chatController");
const auth_1 = require("../middleware/auth");
const validators_1 = require("../middleware/validators");
const router = (0, express_1.Router)();
router.post('/', auth_1.authenticate, validators_1.chatValidator, validators_1.validate, chatController_1.chat);
router.get('/stream', auth_1.authenticateWithQueryToken, chatController_1.streamChat);
router.get('/conversations', auth_1.authenticate, chatController_1.getConversations);
router.get('/conversations/:id', auth_1.authenticate, chatController_1.getConversation);
router.delete('/conversations/:id', auth_1.authenticate, chatController_1.deleteConversation);
router.post('/conversations/:id/regenerate', auth_1.authenticate, chatController_1.regenerateLastResponse);
router.post('/conversations/:id/clear', auth_1.authenticate, chatController_1.clearConversation);
router.get('/conversations/:id/export', auth_1.authenticateWithQueryToken, chatController_1.exportConversation);
exports.default = router;
//# sourceMappingURL=chat.js.map