"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const validators_1 = require("../middleware/validators");
const router = (0, express_1.Router)();
router.post('/register', validators_1.registerValidator, validators_1.validate, authController_1.register);
router.post('/login', validators_1.loginValidator, validators_1.validate, authController_1.login);
router.post('/logout', authController_1.logout);
router.get('/me', auth_1.authenticate, authController_1.getMe);
exports.default = router;
//# sourceMappingURL=auth.js.map