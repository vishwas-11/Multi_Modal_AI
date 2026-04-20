import Groq from 'groq-sdk';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { deleteFile } from '../utils/fileUtils';

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
  confidence?: number;
}

export interface TranscriptionResult {
  text: string;
  language?: string;
  duration?: number;
  segments?: TranscriptionSegment[];
  formattedWithTimestamps: string;
}

export interface AudioAnalysis {
  transcription: TranscriptionResult;
  summary: string;
  actionItems: string[];
  keyTopics: string[];
  sentiment: string;
  speakerCount?: number;
  speakers?: Record<string, string>;
  decisions?: string[];
  language?: string;
}

let groqClient: Groq | null = null;

const getGroqClient = (): Groq => {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY is not configured');
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
};

export const transcribeAudio = async (
  audioPath: string,
  language?: string
): Promise<TranscriptionResult> => {
  const client = getGroqClient();

  if (!fs.existsSync(audioPath)) {
    throw new Error(`Audio file not found: ${audioPath}`);
  }

  const fileStream = fs.createReadStream(audioPath);
  const ext = path.extname(audioPath).toLowerCase().replace('.', '');
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

  const verboseResponse = response as Groq.Audio.Transcription & {
    language?: string;
    duration?: number;
    segments?: Array<{ start: number; end: number; text: string; avg_logprob?: number }>;
  };

  const segments: TranscriptionSegment[] = (verboseResponse.segments || []).map((seg) => ({
    start: seg.start,
    end: seg.end,
    text: seg.text.trim(),
    confidence: seg.avg_logprob ? Math.exp(seg.avg_logprob) : undefined,
  }));

  const result: TranscriptionResult = {
    text: verboseResponse.text,
    language: verboseResponse.language,
    duration: verboseResponse.duration,
    segments,
    formattedWithTimestamps: formatWithTimestamps(segments, verboseResponse.text),
  };

  return result;
};

export const applySpeakerDiarization = async (
  transcription: TranscriptionResult
): Promise<TranscriptionResult> => {
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
    const speakerMap: Record<string, string> = JSON.parse(cleaned);

    transcription.segments = transcription.segments.map((seg, i) => ({
      ...seg,
      speaker: speakerMap[i.toString()] || 'Speaker 1',
    }));

    transcription.formattedWithTimestamps = formatWithSpeakers(transcription.segments);
  } catch {
    console.warn('Speaker diarization failed');
  }

  return transcription;
};

export const analyzeAudioFull = async (
  audioPath: string,
  userPrompt?: string,
  language?: string,
  enableDiarization = true
): Promise<AudioAnalysis> => {
  let transcription = await transcribeAudio(audioPath, language);

  if (enableDiarization) {
    transcription = await applySpeakerDiarization(transcription);
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

export const analyzeAudioFromUrl = async (
  url: string,
  userPrompt?: string,
  language?: string
): Promise<AudioAnalysis> => {
  const ext = path.extname(new URL(url).pathname || '').toLowerCase();
  const safeExt = ext && ext.length <= 5 ? ext : '.mp3';
  const tempPath = path.join(process.cwd(), 'src/uploads', `audio-${uuidv4()}${safeExt}`);

  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 60000,
    });
    await fs.promises.writeFile(tempPath, Buffer.from(response.data));
    return analyzeAudioFull(tempPath, userPrompt, language);
  } finally {
    await deleteFile(tempPath);
  }
};

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const formatWithTimestamps = (segments: TranscriptionSegment[], fallback: string): string => {
  if (!segments.length) return fallback;
  return segments.map((seg) => `[${formatTime(seg.start)}] ${seg.text}`).join('\n');
};

const formatWithSpeakers = (segments: TranscriptionSegment[]): string => {
  return segments
    .map((seg) => `${seg.speaker || 'Speaker 1'} [${formatTime(seg.start)}]: ${seg.text}`)
    .join('\n');
};

export { formatWithTimestamps as formatTranscriptionWithTimestamps };