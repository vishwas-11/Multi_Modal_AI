"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPrivateDownloadUrl = exports.getSignedDeliveryUrl = exports.getTransformedUrl = exports.deleteFromCloudinary = exports.uploadFilePathToCloudinary = exports.uploadToCloudinary = void 0;
const cloudinary_1 = require("../config/cloudinary");
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
        const uploadStream = cloudinary_1.cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
            if (error) {
                reject(new Error(`Cloudinary upload failed: ${error.message}`));
                return;
            }
            if (!result) {
                reject(new Error('Cloudinary upload returned no result'));
                return;
            }
            resolve({
                url: result.secure_url,
                publicId: result.public_id,
                format: result.format,
                size: result.bytes,
                width: result.width,
                height: result.height,
                duration: result.duration,
                resourceType: result.resource_type,
            });
        });
        uploadStream.end(fileBuffer);
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
    const result = await cloudinary_1.cloudinary.uploader.upload(filePath, {
        folder: 'multimodal-ai',
        resource_type: 'auto',
        ...options,
    });
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