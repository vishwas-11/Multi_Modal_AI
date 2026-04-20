"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chatController_1 = require("../controllers/chatController");
const auth_1 = require("../middleware/auth");
const validators_1 = require("../middleware/validators");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.post('/', validators_1.chatValidator, validators_1.validate, chatController_1.chat);
router.get('/stream', chatController_1.streamChat);
router.get('/conversations', chatController_1.getConversations);
router.get('/conversations/:id', chatController_1.getConversation);
router.delete('/conversations/:id', chatController_1.deleteConversation);
router.post('/conversations/:id/regenerate', chatController_1.regenerateLastResponse);
router.post('/conversations/:id/clear', chatController_1.clearConversation);
router.get('/conversations/:id/export', chatController_1.exportConversation);
exports.default = router;
//# sourceMappingURL=chat.js.map