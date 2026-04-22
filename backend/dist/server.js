"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const database_1 = __importDefault(require("./config/database"));
const cloudinary_1 = __importDefault(require("./config/cloudinary"));
const errorHandler_1 = require("./middleware/errorHandler");
const scheduler_1 = require("./utils/scheduler");
// Routes
const auth_1 = __importDefault(require("./routes/auth"));
const upload_1 = __importDefault(require("./routes/upload"));
const analyze_1 = __importDefault(require("./routes/analyze"));
const chat_1 = __importDefault(require("./routes/chat"));
const compare_1 = __importDefault(require("./routes/compare"));
const media_1 = __importDefault(require("./routes/media"));
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '5000', 10);
// Ensure upload dir
const uploadDir = path_1.default.join(process.cwd(), 'src/uploads');
if (!fs_1.default.existsSync(uploadDir))
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
// ─── Middleware ───────────────────────────────────────────────────────────────
app.use((0, helmet_1.default)({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, cookie_parser_1.default)());
if (process.env.NODE_ENV !== 'test') {
    app.use((0, morgan_1.default)(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}
// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        uptime: process.uptime(),
    });
});
// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', auth_1.default);
app.use('/api/upload', upload_1.default);
app.use('/api/media', upload_1.default); // alias: GET/DELETE /api/media/:id
app.use('/api/gallery', media_1.default); // gallery, waveform, cleanup
app.use('/api/analyze', analyze_1.default);
app.use('/api/chat', chat_1.default);
app.use('/api', compare_1.default); // /api/compare, /api/batch
// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(errorHandler_1.notFound);
app.use(errorHandler_1.errorHandler);
// ─── Start ────────────────────────────────────────────────────────────────────
const startServer = async () => {
    try {
        await (0, database_1.default)();
        (0, cloudinary_1.default)();
        (0, scheduler_1.startCleanupScheduler)();
        app.listen(PORT, () => {
            console.log(`\n Server running on port ${PORT}`);
            console.log(` Health: Health check passed!\n`);
        });
    }
    catch (error) {
        console.error(' Failed to start server:', error);
        process.exit(1);
    }
};
process.on('SIGTERM', () => { console.log('SIGTERM received'); process.exit(0); });
process.on('SIGINT', () => { console.log('SIGINT received'); process.exit(0); });
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Promise Rejection:', reason);
    process.exit(1);
});
startServer();
exports.default = app;
//# sourceMappingURL=server.js.map