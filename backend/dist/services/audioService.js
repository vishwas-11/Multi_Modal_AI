"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatTranscriptionWithTimestamps = exports.analyzeAudioFromUrl = exports.analyzeAudioFull = exports.applySpeakerDiarization = exports.transcribeAudio = void 0;
const groq_sdk_1 = __importDefault(require("groq-sdk"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const axios_1 = __importDefault(require("axios"));
const uuid_1 = require("uuid");
const fileUtils_1 = require("../utils/fileUtils");
let groqClient = null;
const getGroqClient = () => {
    if (!groqClient) {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey)
            throw new Error('GROQ_API_KEY is not configured');
        groqClient = new groq_sdk_1.default({ apiKey });
    }
    return groqClient;
};
const transcribeAudio = async (audioPath, language) => {
    const client = getGroqClient();
    if (!fs_1.default.existsSync(audioPath)) {
        throw new Error(`Audio file not found: ${audioPath}`);
    }
    const fileStream = fs_1.default.createReadStream(audioPath);
    const ext = path_1.default.extname(audioPath).toLowerCase().replace('.', '');
    const supportedFormats = ['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm', 'ogg', 'flac'];
    if (!supportedFormats.includes(ext)) {
        throw new Error(`Unsupported audio format: ${ext}`);
    }
    const response = await client.audio.transcriptions.create({
        file: fileStream,
        model: 'whisper-large-v3',
        response_format: 'verbose_json',
        ...(language && { language }),
        timestamp_granularities: ['segment'],
    });
    const verboseResponse = response;
    const segments = (verboseResponse.segments || []).map((seg) => ({
        start: seg.start,
        end: seg.end,
        text: seg.text.trim(),
        confidence: seg.avg_logprob ? Math.exp(seg.avg_logprob) : undefined,
    }));
    const result = {
        text: verboseResponse.text,
        language: verboseResponse.language,
        duration: verboseResponse.duration,
        segments,
        formattedWithTimestamps: formatWithTimestamps(segments, verboseResponse.text),
    };
    return result;
};
exports.transcribeAudio = transcribeAudio;
const applySpeakerDiarization = async (transcription) => {
    if (!transcription.segments || transcription.segments.length < 3) {
        return transcription;
    }
    const client = getGroqClient();
    const segmentText = transcription.segments
        .map((s, i) => `[${i}] ${formatTime(s.start)}: ${s.text}`)
        .join('\n');
    const prompt = `You are a speaker diarization system. Analyze this conversation transcript and identify when speakers change.

Transcript (with segment indices):
${segmentText}

Instructions:
1. Identify distinct speakers
2. Label speakers as "Speaker 1", "Speaker 2"
3. Return ONLY JSON mapping index to speaker`;
    try {
        const response = await client.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 1000,
            temperature: 0.1,
        });
        const rawText = response.choices[0]?.message?.content || '{}';
        const cleaned = rawText.replace(/```json\n?|```\n?/g, '').trim();
        const speakerMap = JSON.parse(cleaned);
        transcription.segments = transcription.segments.map((seg, i) => ({
            ...seg,
            speaker: speakerMap[i.toString()] || 'Speaker 1',
        }));
        transcription.formattedWithTimestamps = formatWithSpeakers(transcription.segments);
    }
    catch {
        console.warn('Speaker diarization failed');
    }
    return transcription;
};
exports.applySpeakerDiarization = applySpeakerDiarization;
const analyzeAudioFull = async (audioPath, userPrompt, language, enableDiarization = true) => {
    let transcription = await (0, exports.transcribeAudio)(audioPath, language);
    if (enableDiarization) {
        transcription = await (0, exports.applySpeakerDiarization)(transcription);
    }
    const client = getGroqClient();
    const response = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{
                role: 'user',
                content: `Analyze this transcript:\n${transcription.formattedWithTimestamps}`
            }],
    });
    return {
        transcription,
        summary: response.choices[0]?.message?.content || '',
        actionItems: [],
        keyTopics: [],
        sentiment: 'neutral',
    };
};
exports.analyzeAudioFull = analyzeAudioFull;
const analyzeAudioFromUrl = async (url, userPrompt, language) => {
    const ext = path_1.default.extname(new URL(url).pathname || '').toLowerCase();
    const safeExt = ext && ext.length <= 5 ? ext : '.mp3';
    const tempPath = path_1.default.join(process.cwd(), 'src/uploads', `audio-${(0, uuid_1.v4)()}${safeExt}`);
    try {
        const response = await axios_1.default.get(url, {
            responseType: 'arraybuffer',
            timeout: 60000,
        });
        await fs_1.default.promises.writeFile(tempPath, Buffer.from(response.data));
        return (0, exports.analyzeAudioFull)(tempPath, userPrompt, language);
    }
    finally {
        await (0, fileUtils_1.deleteFile)(tempPath);
    }
};
exports.analyzeAudioFromUrl = analyzeAudioFromUrl;
const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};
const formatWithTimestamps = (segments, fallback) => {
    if (!segments.length)
        return fallback;
    return segments.map((seg) => `[${formatTime(seg.start)}] ${seg.text}`).join('\n');
};
exports.formatTranscriptionWithTimestamps = formatWithTimestamps;
const formatWithSpeakers = (segments) => {
    return segments
        .map((seg) => `${seg.speaker || 'Speaker 1'} [${formatTime(seg.start)}]: ${seg.text}`)
        .join('\n');
};
//# sourceMappingURL=audioService.js.map