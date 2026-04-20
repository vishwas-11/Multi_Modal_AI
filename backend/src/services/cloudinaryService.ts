import { UploadApiResponse, UploadApiOptions } from 'cloudinary';
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary';

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  format: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  resourceType: string;
}

/**
 * Upload a file buffer to Cloudinary
 */
export const uploadToCloudinary = (
  fileBuffer: Buffer,
  options: Partial<UploadApiOptions> = {}
): Promise<CloudinaryUploadResult> => {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      'Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.'
    );
  }

  return new Promise((resolve, reject) => {
    const uploadOptions: UploadApiOptions = {
      folder: 'multimodal-ai',
      resource_type: 'auto',
      ...options,
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result: UploadApiResponse | undefined) => {
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
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Upload from a local file path
 */
export const uploadFilePathToCloudinary = async (
  filePath: string,
  options: Partial<UploadApiOptions> = {}
): Promise<CloudinaryUploadResult> => {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      'Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.'
    );
  }

  const result = await cloudinary.uploader.upload(filePath, {
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

/**
 * Delete a file from Cloudinary
 */
export const deleteFromCloudinary = async (
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<void> => {
  if (!isCloudinaryConfigured()) return;

  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  } catch (error) {
    console.warn(`Warning: Could not delete Cloudinary asset ${publicId}:`, error);
  }
};

/**
 * Get a transformation URL for an image
 */
export const getTransformedUrl = (
  publicId: string,
  transformations: Record<string, string | number>
): string => {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      'Cloudinary is not configured. Cannot generate transformed URLs without Cloudinary credentials.'
    );
  }

  return cloudinary.url(publicId, {
    secure: true,
    ...transformations,
  });
};

/**
 * Get a signed delivery URL (useful when raw assets are ACL-restricted).
 */
export const getSignedDeliveryUrl = (
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'raw'
): string => {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      'Cloudinary is not configured. Cannot generate signed delivery URLs without Cloudinary credentials.'
    );
  }

  return cloudinary.url(publicId, {
    secure: true,
    sign_url: true,
    resource_type: resourceType,
    type: 'upload',
  });
};

/**
 * Get a private download URL for ACL-restricted assets.
 */
export const getPrivateDownloadUrl = (
  publicId: string,
  format: string,
  resourceType: 'image' | 'video' | 'raw' = 'raw',
  deliveryType: 'upload' | 'private' | 'authenticated' = 'upload'
): string => {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      'Cloudinary is not configured. Cannot generate private download URLs without Cloudinary credentials.'
    );
  }

  return cloudinary.utils.private_download_url(publicId, format, {
    resource_type: resourceType,
    type: deliveryType,
  });
};