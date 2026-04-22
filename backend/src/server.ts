import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';

import connectDB from './config/database';
import configureCloudinary from './config/cloudinary';
import { errorHandler, notFound } from './middleware/errorHandler';
import { startCleanupScheduler } from './utils/scheduler';

// Routes
import authRoutes    from './routes/auth';
import uploadRoutes  from './routes/upload';
import analyzeRoutes from './routes/analyze';
import chatRoutes    from './routes/chat';
import compareRoutes from './routes/compare';
import mediaRoutes   from './routes/media';

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// Ensure upload dir
const uploadDir = path.join(process.cwd(), 'src/uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Multi-modal backend is running',
    health: '/health',
    apiBase: '/api',
  });
});

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',    authRoutes);
app.use('/api/upload',  uploadRoutes);
app.use('/api/media',   uploadRoutes);    // alias: GET/DELETE /api/media/:id
app.use('/api/gallery', mediaRoutes);     // gallery, waveform, cleanup
app.use('/api/analyze', analyzeRoutes);
app.use('/api/chat',    chatRoutes);
app.use('/api',         compareRoutes);   // /api/compare, /api/batch

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
const startServer = async (): Promise<void> => {
  try {
    await connectDB();
    configureCloudinary();
    startCleanupScheduler();

    app.listen(PORT, () => {
      console.log(`\n Server running on port ${PORT}`);
      console.log(` Health: Health check passed!\n`);
    });
  } catch (error) {
    console.error(' Failed to start server:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => { console.log('SIGTERM received'); process.exit(0); });
process.on('SIGINT',  () => { console.log('SIGINT received');  process.exit(0); });
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Promise Rejection:', reason);
  process.exit(1);
});

startServer();
export default app;