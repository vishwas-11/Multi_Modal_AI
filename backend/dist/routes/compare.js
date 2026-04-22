"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const compareController_1 = require("../controllers/compareController");
const auth_1 = require("../middleware/auth");
const validators_1 = require("../middleware/validators");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.post('/compare', validators_1.compareValidator, validators_1.validate, compareController_1.compareMediaItems);
router.post('/batch', auth_1.authenticate, compareController_1.batchAnalyze);
exports.default = router;
//# sourceMappingURL=compare.js.map