"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = exports.authenticateWithQueryToken = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const resolveToken = (req, allowQueryToken) => {
    // Check Authorization header
    if (req.headers.authorization?.startsWith('Bearer ')) {
        return req.headers.authorization.split(' ')[1];
    }
    // Check cookie as fallback
    if (req.cookies?.token) {
        return req.cookies.token;
    }
    // Allow query token only for explicitly scoped routes (e.g. SSE/download)
    if (allowQueryToken && typeof req.query.token === 'string') {
        return req.query.token;
    }
    return undefined;
};
const authenticateRequest = (allowQueryToken = false) => async (req, res, next) => {
    try {
        const token = resolveToken(req, allowQueryToken);
        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.',
            });
            return;
        }
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET is not configured');
        }
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        // Get fresh user from DB
        const user = await User_1.default.findById(decoded.id).select('-password');
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'User no longer exists.',
            });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({
                success: false,
                message: 'Invalid token.',
            });
            return;
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({
                success: false,
                message: 'Token expired.',
            });
            return;
        }
        next(error);
    }
};
exports.authenticate = authenticateRequest(false);
exports.authenticateWithQueryToken = authenticateRequest(true);
// Generate JWT
const generateToken = (userId, email) => {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret)
        throw new Error('JWT_SECRET is not configured');
    return jsonwebtoken_1.default.sign({ id: userId, email }, jwtSecret, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
};
exports.generateToken = generateToken;
//# sourceMappingURL=auth.js.map