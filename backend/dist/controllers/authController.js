"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.getMe = exports.login = exports.register = void 0;
const User_1 = __importDefault(require("../models/User"));
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const response_1 = require("../utils/response");
const setAuthCookie = (res, token) => {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
};
exports.register = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { name, email, password } = req.body;
    const existing = await User_1.default.findOne({ email: String(email).toLowerCase() });
    if (existing) {
        (0, response_1.sendError)(res, 'Email already registered', 409);
        return;
    }
    const user = await User_1.default.create({ name, email, password });
    const token = (0, auth_1.generateToken)(user._id.toString(), user.email);
    setAuthCookie(res, token);
    (0, response_1.sendSuccess)(res, { token, user: { id: user._id, name: user.name, email: user.email } }, 'Registered successfully', 201);
});
exports.login = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { email, password } = req.body;
    const user = await User_1.default.findOne({ email: String(email).toLowerCase() }).select('+password');
    if (!user) {
        (0, response_1.sendError)(res, 'Invalid credentials', 401);
        return;
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        (0, response_1.sendError)(res, 'Invalid credentials', 401);
        return;
    }
    const token = (0, auth_1.generateToken)(user._id.toString(), user.email);
    setAuthCookie(res, token);
    (0, response_1.sendSuccess)(res, {
        token,
        user: { id: user._id, name: user.name, email: user.email },
    });
});
exports.getMe = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        (0, response_1.sendError)(res, 'Unauthorized', 401);
        return;
    }
    (0, response_1.sendSuccess)(res, {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
    });
});
exports.logout = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    res.clearCookie('token');
    (0, response_1.sendSuccess)(res, {}, 'Logged out');
});
//# sourceMappingURL=authController.js.map