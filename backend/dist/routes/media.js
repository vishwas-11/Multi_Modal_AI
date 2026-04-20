"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mediaController_1 = require("../controllers/mediaController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/gallery', mediaController_1.getSessionGallery);
router.get('/:id/waveform', mediaController_1.getWaveformData);
router.post('/cleanup', mediaController_1.triggerCleanup);
exports.default = router;
//# sourceMappingURL=media.js.map