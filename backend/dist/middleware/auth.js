"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const authenticate = async (req, res, next) => {
    try {
        let token;
        // Check Authorization header
        if (req.headers.authorization?.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }
        // Check cookie as fallback
        if (!token && req.cookies?.token) {
            token = req.cookies.token;
        }
        // EventSource/download requests often pass JWT via query string
        if (!token && typeof req.query.token === 'string') {
            token = req.query.token;
        }
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
exports.authenticate = authenticate;
// Generate JWT
const generateToken = (userId, email) => {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret)
        throw new Error('JWT_SECRET is not configured');
    return jsonwebtoken_1.default.sign({ id: userId, email }, jwtSecret, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
};
exports.generateToken = generateToken;
//# sourceMappingURL=auth.js.map