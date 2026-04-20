"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analyzeController_1 = require("../controllers/analyzeController");
const auth_1 = require("../middleware/auth");
const validators_1 = require("../middleware/validators");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.post('/image', validators_1.analyzeValidator, validators_1.validate, analyzeController_1.analyzeImageMedia);
router.post('/image/ocr', validators_1.analyzeValidator, validators_1.validate, analyzeController_1.ocrImageMedia);
router.post('/image/structured', validators_1.analyzeValidator, validators_1.validate, analyzeController_1.structuredExtractMedia);
router.post('/image/chart', validators_1.analyzeValidator, validators_1.validate, analyzeController_1.analyzeChartMedia);
router.post('/video', validators_1.analyzeValidator, validators_1.validate, analyzeController_1.analyzeVideoMedia);
router.post('/video/temporal-qa', validators_1.analyzeValidator, validators_1.validate, analyzeController_1.temporalVideoQA);
router.post('/audio', validators_1.analyzeValidator, validators_1.validate, analyzeController_1.analyzeAudioMedia);
router.post('/document', validators_1.analyzeValidator, validators_1.validate, analyzeController_1.analyzeDocumentMedia);
router.post('/document/multipage', auth_1.authenticate, analyzeController_1.analyzeMultiPageDocument);
exports.default = router;
//# sourceMappingURL=analyze.js.map