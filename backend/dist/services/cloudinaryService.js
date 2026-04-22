"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPrivateDownloadUrl = exports.getSignedDeliveryUrl = exports.getTransformedUrl = exports.deleteFromCloudinary = exports.uploadFilePathToCloudinary = exports.uploadToCloudinary = void 0;
const cloudinary_1 = require("../config/cloudinary");
const DEFAULT_UPLOAD_RETRIES = parseInt(process.env.CLOUDINARY_UPLOAD_RETRIES || '3', 10);
const BASE_RETRY_DELAY_MS = parseInt(process.env.CLOUDINARY_RETRY_BASE_DELAY_MS || '500', 10);
const sleep = (ms) => new Promise((resolve) => {
    setTimeout(resolve, ms);
});
const isRetryableCloudinaryError = (error) => {
    if (!error || typeof error !== 'object')
        return false;
    const err = error;
    const code = err.code?.toUpperCase();
    const message = err.message?.toLowerCase() || '';
    if (code && ['ECONNRESET', 'ETIMEDOUT', 'ESOCKETTIMEDOUT', 'EAI_AGAIN', 'ENOTFOUND'].includes(code)) {
        return true;
    }
    return (message.includes('socket disconnected') ||
        message.includes('tls') ||
        message.includes('network') ||
        message.includes('timed out'));
};
const uploadWithRetry = async (uploadFn, fileLabel) => {
    let lastError;
    for (let attempt = 1; attempt <= DEFAULT_UPLOAD_RETRIES; attempt += 1) {
        try {
            return await uploadFn();
        }
        catch (error) {
            lastError = error;
            if (!isRetryableCloudinaryError(error) || attempt === DEFAULT_UPLOAD_RETRIES) {
                throw error;
            }
            const delayMs = BASE_RETRY_DELAY_MS * 2 ** (attempt - 1);
            console.warn(`Cloudinary upload retry ${attempt}/${DEFAULT_UPLOAD_RETRIES} for ${fileLabel} after ${delayMs}ms`);
            await sleep(delayMs);
        }
    }
    throw lastError instanceof Error ? lastError : new Error('Cloudinary upload failed after retries');
};
/**
 * Upload a file buffer to Cloudinary
 */
const uploadToCloudinary = (fileBuffer, options = {}) => {
    if (!(0, cloudinary_1.isCloudinaryConfigured)()) {
        throw new Error('Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.');
    }
    return new Promise((resolve, reject) => {
        const uploadOptions = {
            folder: 'multimodal-ai',
            resource_type: 'auto',
            ...options,
        };
        uploadWithRetry(() => new Promise((retryResolve, retryReject) => {
            const uploadStream = cloudinary_1.cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
                if (error) {
                    retryReject(error);
                    return;
                }
                if (!result) {
                    retryReject(new Error('Cloudinary upload returned no result'));
                    return;
                }
                retryResolve(result);
            });
            uploadStream.end(fileBuffer);
        }), 'buffer upload')
            .then((result) => resolve({
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            size: result.bytes,
            width: result.width,
            height: result.height,
            duration: result.duration,
            resourceType: result.resource_type,
        }))
            .catch((error) => reject(new Error(`Cloudinary upload failed: ${error.message}`)));
    });
};
exports.uploadToCloudinary = uploadToCloudinary;
/**
 * Upload from a local file path
 */
const uploadFilePathToCloudinary = async (filePath, options = {}) => {
    if (!(0, cloudinary_1.isCloudinaryConfigured)()) {
        throw new Error('Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.');
    }
    const result = await uploadWithRetry(() => cloudinary_1.cloudinary.uploader.upload(filePath, {
        folder: 'multimodal-ai',
        resource_type: 'auto',
        ...options,
    }), filePath);
    return {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        size: result.bytes,
        width: result.width,
        height: result.height,
        duration: result.duration,
        resourceType: result.resource_type,
    };
};
exports.uploadFilePathToCloudinary = uploadFilePathToCloudinary;
/**
 * Delete a file from Cloudinary
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
    if (!(0, cloudinary_1.isCloudinaryConfigured)())
        return;
    try {
        await cloudinary_1.cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
        });
    }
    catch (error) {
        console.warn(`Warning: Could not delete Cloudinary asset ${publicId}:`, error);
    }
};
exports.deleteFromCloudinary = deleteFromCloudinary;
/**
 * Get a transformation URL for an image
 */
const getTransformedUrl = (publicId, transformations) => {
    if (!(0, cloudinary_1.isCloudinaryConfigured)()) {
        throw new Error('Cloudinary is not configured. Cannot generate transformed URLs without Cloudinary credentials.');
    }
    return cloudinary_1.cloudinary.url(publicId, {
        secure: true,
        ...transformations,
    });
};
exports.getTransformedUrl = getTransformedUrl;
/**
 * Get a signed delivery URL (useful when raw assets are ACL-restricted).
 */
const getSignedDeliveryUrl = (publicId, resourceType = 'raw') => {
    if (!(0, cloudinary_1.isCloudinaryConfigured)()) {
        throw new Error('Cloudinary is not configured. Cannot generate signed delivery URLs without Cloudinary credentials.');
    }
    return cloudinary_1.cloudinary.url(publicId, {
        secure: true,
        sign_url: true,
        resource_type: resourceType,
        type: 'upload',
    });
};
exports.getSignedDeliveryUrl = getSignedDeliveryUrl;
/**
 * Get a private download URL for ACL-restricted assets.
 */
const getPrivateDownloadUrl = (publicId, format, resourceType = 'raw', deliveryType = 'upload') => {
    if (!(0, cloudinary_1.isCloudinaryConfigured)()) {
        throw new Error('Cloudinary is not configured. Cannot generate private download URLs without Cloudinary credentials.');
    }
    return cloudinary_1.cloudinary.utils.private_download_url(publicId, format, {
        resource_type: resourceType,
        type: deliveryType,
    });
};
exports.getPrivateDownloadUrl = getPrivateDownloadUrl;
//# sourceMappingURL=cloudinaryService.js.map