"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uploadController_1 = require("../controllers/uploadController");
const auth_1 = require("../middleware/auth");
const multer_1 = require("../config/multer");
const fileValidator_1 = require("../middleware/fileValidator");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.post('/', multer_1.upload.array('files', 10), fileValidator_1.validateUploadedFiles, uploadController_1.uploadMedia);
router.post('/single', multer_1.upload.single('file'), fileValidator_1.validateUploadedFiles, uploadController_1.uploadMedia);
router.post('/clipboard', uploadController_1.uploadClipboardImage);
router.get('/', uploadController_1.listMedia);
router.get('/:id', uploadController_1.getMediaById);
router.delete('/:id', uploadController_1.deleteMedia);
exports.default = router;
//# sourceMappingURL=upload.js.map