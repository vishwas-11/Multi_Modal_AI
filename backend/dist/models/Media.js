"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const analysisSchema = new mongoose_1.Schema({
    summary: String,
    description: String,
    keyMoments: [{ timestamp: Number, description: String }],
    transcription: String,
    extractedText: String,
    structuredData: mongoose_1.Schema.Types.Mixed,
    tables: [{ headers: [String], rows: [[String]] }],
    chartData: mongoose_1.Schema.Types.Mixed,
    tags: [String],
    sentiment: String,
    actionItems: [String],
    keyTopics: [String],
    speakerCount: Number,
    speakers: mongoose_1.Schema.Types.Mixed,
    decisions: [String],
    language: String,
    analyzedAt: { type: Date, default: Date.now },
}, { _id: false });
const mediaSchema = new mongoose_1.Schema({
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    type: {
        type: String,
        enum: ['image', 'video', 'audio', 'document'],
        required: true,
    },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    analysis: analysisSchema,
    thumbnail: String,
    posterFrame: String,
    waveformData: {
        peaks: [Number],
        duration: Number,
    },
    duration: Number,
    dimensions: {
        width: Number,
        height: Number,
    },
    videoMetadata: {
        fps: Number,
        codec: String,
        hasAudio: Boolean,
        audioCodec: String,
        frameCount: Number,
        framesExtracted: Number,
        extractionStrategy: String,
    },
    pageCount: Number,
}, { timestamps: true });
// Indexes for performance
mediaSchema.index({ uploadedBy: 1, createdAt: -1 });
mediaSchema.index({ type: 1, uploadedBy: 1 });
exports.default = mongoose_1.default.model('Media', mediaSchema);
//# sourceMappingURL=Media.js.map