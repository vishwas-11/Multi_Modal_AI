# ModalAI — Multimodal AI Assistant

A production-grade web application for analyzing images, video, audio, and documents using state-of-the-art AI models. Built with Next.js, Express, TypeScript, and powered by Google Gemini and Groq Whisper.

---

## Tech Stack

**Backend** — Node.js · Express · TypeScript · MongoDB · Cloudinary · FFmpeg · Sharp · Groq Whisper · Google Gemini 1.5 Pro

**Frontend** — Next.js 14+ (App Router) · TypeScript · Tailwind CSS · Zustand · Framer Motion · WebGL (OGL)

---

## Features

- Image upload with Visual Q&A, OCR, structured data extraction, and chart analysis
- Video processing with three frame extraction strategies (fixed interval, scene change, uniform sampling)
- Audio transcription via Groq Whisper with speaker diarization and action item extraction
- Document analysis with multi-page context, table extraction, and handwriting recognition
- Streaming chat with full conversation history via Server-Sent Events
- Multi-file comparison (up to 10 files) in a single LLM context window
- Media gallery sidebar with waveform previews, video poster frames, and thumbnails
- Export conversations as Markdown or HTML

---

## Prerequisites

Make sure all of these are installed and available before you start.

| Requirement | Version | Check |
|-------------|---------|-------|
| Node.js | >= 18.0.0 | `node -v` |
| npm | >= 9.0.0 | `npm -v` |
| FFmpeg | any recent | `ffmpeg -version` |
| Git | any | `git --version` |

### Install FFmpeg

**macOS**
```bash
brew install ffmpeg
```

**Ubuntu / Debian**
```bash
sudo apt update && sudo apt install -y ffmpeg
```

**Windows**
Download from [ffmpeg.org/download.html](https://ffmpeg.org/download.html), extract, and add the `bin/` folder to your system PATH.

---

## API Keys Required

You need accounts and API keys from the following services before running the project locally. All free tiers are sufficient for development.

| Service | Purpose | Get Key |
|---------|---------|---------|
| MongoDB Atlas | Database | [cloud.mongodb.com](https://cloud.mongodb.com) — free M0 cluster |
| Cloudinary | Media storage | [cloudinary.com](https://cloudinary.com) — free tier |
| Google Gemini | Vision + text LLM | [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) |
| Groq | Whisper transcription + analysis | [console.groq.com/keys](https://console.groq.com/keys) — free tier |

---

## Project Structure

```
multimodal-ai/
├── backend/               Express + TypeScript API server
│   ├── src/
│   │   ├── config/        Database, Cloudinary, Multer configuration
│   │   ├── controllers/   Route handlers (auth, upload, analyze, chat, compare)
│   │   ├── middleware/     JWT auth, error handling, file validation
│   │   ├── models/        Mongoose models (User, Media, Conversation)
│   │   ├── routes/        Express route definitions
│   │   ├── services/      Business logic (Gemini, Groq, FFmpeg, Sharp, Cloudinary)
│   │   ├── utils/         Helpers (token counter, scheduler, file utils)
│   │   └── server.ts      Express app entry point
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
│
└── frontend/              Next.js App Router application
    ├── src/
    │   ├── app/           Pages (landing, login, register, app)
    │   ├── components/    UI components (chat, media, analysis, layout)
    │   ├── hooks/         Custom hooks (SSE, upload, clipboard, auth)
    │   ├── lib/           API client, auth helpers, utilities
    │   ├── store/         Zustand state (auth, chat, media)
    │   └── types/         Shared TypeScript types
    ├── .env.local.example
    └── package.json
```

---

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/multimodal-ai.git
cd multimodal-ai
```

---

### 2. Backend Setup

#### 2a. Navigate to the backend directory

```bash
cd backend
```

#### 2b. Install dependencies

```bash
npm install
```

#### 2c. Create your environment file

```bash
cp .env.example .env
```

#### 2d. Fill in your `.env` file

Open `backend/.env` in your editor and fill in every value:

```env
# ── Server ────────────────────────────────────────────────────────────────────
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# ── MongoDB ───────────────────────────────────────────────────────────────────
# Get this from MongoDB Atlas: Clusters → Connect → Drivers → copy the URI
# Replace <username>, <password>, and <dbname> with your values
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/multimodal_ai

# ── JWT ───────────────────────────────────────────────────────────────────────
# Use any long random string — minimum 32 characters
JWT_SECRET=change_this_to_a_long_random_secret_minimum_32_chars
JWT_EXPIRES_IN=7d

# ── Cloudinary ────────────────────────────────────────────────────────────────
# Found at: cloudinary.com → Dashboard → API Keys
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ── Google Gemini ─────────────────────────────────────────────────────────────
# Found at: aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key

# ── Groq (Whisper transcription) ──────────────────────────────────────────────
# Found at: console.groq.com/keys
GROQ_API_KEY=your_groq_api_key

# ── File Handling ─────────────────────────────────────────────────────────────
MAX_FILE_SIZE=104857600
FILE_MAX_AGE_HOURS=24
```

#### 2e. Verify FFmpeg is accessible

```bash
ffmpeg -version
# Should print FFmpeg version info — if command not found, revisit Prerequisites
```

#### 2f. Run TypeScript type check (optional but recommended)

```bash
npm run typecheck
# Should output nothing if all types are correct
```

#### 2g. Start the backend development server

```bash
npm run dev
```

You should see:

```
✅ MongoDB Connected: cluster0.xxxxx.mongodb.net
✅ Cloudinary configured
⏰ File cleanup scheduler started (max age: 24h)

🚀 Server running on port 5000
📍 Environment: development
🔗 Health: http://localhost:5000/health
```

#### 2h. Verify the backend is running

Open [http://localhost:5000/health](http://localhost:5000/health) in your browser. You should see:

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development",
  "uptime": 4.2
}
```

---

### 3. Frontend Setup

Open a **new terminal window** and keep the backend running.

#### 3a. Navigate to the frontend directory

```bash
# From the project root
cd frontend
```

#### 3b. Install dependencies

```bash
npm install
```

#### 3c. Create your environment file

```bash
cp .env.local.example .env.local
```

#### 3d. Fill in your `.env.local` file

```env
# The URL where your backend is running locally
NEXT_PUBLIC_API_URL=http://localhost:5000
```

That is the only environment variable the frontend needs locally.

#### 3e. Start the frontend development server

```bash
npm run dev
```

You should see:

```
▲ Next.js 14.x.x
- Local: http://localhost:3000
- Ready in 2.1s
```

#### 3f. Open the application

Go to [http://localhost:3000](http://localhost:3000) in your browser.

---

## Running Both Services Together

The most convenient way is to use two terminal tabs or panes side by side.

**Terminal 1 — Backend**
```bash
cd multimodal-ai/backend
npm run dev
# Runs on http://localhost:5000
```

**Terminal 2 — Frontend**
```bash
cd multimodal-ai/frontend
npm run dev
# Runs on http://localhost:3000
```

Alternatively, if you have `concurrently` installed globally (`npm install -g concurrently`), you can run both from the project root:

```bash
# From multimodal-ai/
concurrently \
  "cd backend && npm run dev" \
  "cd frontend && npm run dev"
```

---

## All Available Scripts

### Backend (`backend/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot-reload (ts-node + nodemon) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Run compiled production build from `dist/server.js` |
| `npm run typecheck` | Run `tsc --noEmit` — check types without emitting files |

### Frontend (`frontend/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js development server on port 3000 |
| `npm run build` | Create optimised production build in `.next/` |
| `npm run start` | Serve the production build (requires `build` first) |
| `npm run lint` | Run ESLint across all source files |

---

## API Endpoints Reference

All endpoints are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>` header.

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | No | Create a new account |
| POST | `/auth/login` | No | Login and receive JWT |
| GET | `/auth/me` | Yes | Get current user profile |
| POST | `/auth/logout` | No | Clear auth cookie |

### File Upload

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/upload` | Yes | Upload 1–10 files (multipart/form-data, field: `files`) |
| POST | `/upload/single` | Yes | Upload single file (field: `file`) |
| POST | `/upload/clipboard` | Yes | Upload base64 image from clipboard paste |
| GET | `/media` | Yes | List your uploaded media (paginated) |
| GET | `/media/:id` | Yes | Get a single media item with analysis |
| DELETE | `/media/:id` | Yes | Delete media from DB and Cloudinary |

### Analysis

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/analyze/image` | Yes | General image analysis via Gemini Vision |
| POST | `/analyze/image/ocr` | Yes | Extract all visible text (OCR) |
| POST | `/analyze/image/structured` | Yes | Extract structured data (invoice, table, form, receipt) |
| POST | `/analyze/image/chart` | Yes | Analyze charts and graphs, extract data points |
| POST | `/analyze/video` | Yes | Extract frames and analyze video content |
| POST | `/analyze/video/temporal-qa` | Yes | Answer questions about specific video timestamps |
| POST | `/analyze/audio` | Yes | Transcribe and analyze audio (Groq Whisper + diarization) |
| POST | `/analyze/document` | Yes | Analyze document images and PDFs |
| POST | `/analyze/document/multipage` | Yes | Analyze multiple pages as one document |

### Chat

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/chat` | Yes | Send a message (non-streaming) |
| GET | `/chat/stream` | Yes | Send a message with SSE streaming response |
| GET | `/chat/conversations` | Yes | List all conversations |
| GET | `/chat/conversations/:id` | Yes | Get conversation with full message history |
| DELETE | `/chat/conversations/:id` | Yes | Delete a conversation |
| POST | `/chat/conversations/:id/regenerate` | Yes | Re-generate the last assistant response |
| POST | `/chat/conversations/:id/clear` | Yes | Clear all messages in conversation |
| GET | `/chat/conversations/:id/export` | Yes | Export as `?format=md` or `?format=html` |

### Compare & Batch

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/compare` | Yes | Compare 2–10 media files in a single context window |
| POST | `/batch` | Yes | Run the same analysis on up to 10 images, returns grid |

### Media Gallery

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/gallery/gallery` | Yes | Get session media grouped by type (last 24h) |
| GET | `/gallery/:id/waveform` | Yes | Get audio waveform peak data for visualization |

---

## Environment Variables Reference

### Backend (`.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 5000) |
| `NODE_ENV` | No | `development` or `production` |
| `CLIENT_URL` | Yes | Frontend URL for CORS (e.g. `http://localhost:3000`) |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret key for signing JWTs — keep this private |
| `JWT_EXPIRES_IN` | No | Token lifetime (default: `7d`) |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `GROQ_API_KEY` | Yes | Groq API key (Whisper transcription + LLM) |
| `MAX_FILE_SIZE` | No | Max upload size in bytes (default: 104857600 = 100MB) |
| `FILE_MAX_AGE_HOURS` | No | How long to keep temp files (default: 24) |

### Frontend (`.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend base URL (e.g. `http://localhost:5000`) |

---

## Troubleshooting

**Backend fails to start — `MongoDB connection failed`**

Check that your `MONGODB_URI` is correct and that your IP address is whitelisted in MongoDB Atlas under Network Access → Add IP Address. For local development, add `0.0.0.0/0` (allow from anywhere).

**Backend fails to start — `Cloudinary credentials are missing`**

Make sure all three Cloudinary variables are set in `.env`: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`.

**File upload returns 400 — `File type not supported`**

The backend validates files using magic bytes, not just the file extension. Make sure you are uploading a genuinely supported format. Supported types: JPEG, PNG, GIF, WebP, BMP, MP4, WebM, MOV, AVI, MP3, WAV, M4A, OGG, FLAC, PDF, TXT, CSV, JSON.

**Video analysis fails — `FFprobe failed`**

FFmpeg is not installed or not in PATH. Run `ffmpeg -version` to confirm. See the Prerequisites section for install instructions.

**Audio transcription fails — `GROQ_API_KEY is not configured`**

Add your Groq API key to the backend `.env` file. Get one free at [console.groq.com/keys](https://console.groq.com/keys).

**Frontend shows blank page after login**

Make sure `NEXT_PUBLIC_API_URL` in `frontend/.env.local` is pointing to the correct backend URL and that the backend is running.

**CORS error in browser console**

Make sure `CLIENT_URL` in the backend `.env` exactly matches your frontend origin including the port, for example `http://localhost:3000`. No trailing slash.

**SSE streaming does not work**

Server-Sent Events require the browser to keep an HTTP connection open. Make sure no proxy (like nginx or a corporate firewall) is buffering the response. In development this should work out of the box.

---

## Deployment

- Backend on **Render** (Docker, includes FFmpeg)
- Frontend on **Vercel** (automatic Next.js detection)

---

## License

MIT
