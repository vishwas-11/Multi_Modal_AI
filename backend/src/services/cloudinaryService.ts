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

const DEFAULT_UPLOAD_RETRIES = parseInt(process.env.CLOUDINARY_UPLOAD_RETRIES || '3', 10);
const BASE_RETRY_DELAY_MS = parseInt(process.env.CLOUDINARY_RETRY_BASE_DELAY_MS || '500', 10);

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const isRetryableCloudinaryError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false;
  const err = error as { code?: string; message?: string };
  const code = err.code?.toUpperCase();
  const message = err.message?.toLowerCase() || '';

  if (code && ['ECONNRESET', 'ETIMEDOUT', 'ESOCKETTIMEDOUT', 'EAI_AGAIN', 'ENOTFOUND'].includes(code)) {
    return true;
  }

  return (
    message.includes('socket disconnected') ||
    message.includes('tls') ||
    message.includes('network') ||
    message.includes('timed out')
  );
};

const uploadWithRetry = async (
  uploadFn: () => Promise<UploadApiResponse>,
  fileLabel: string
): Promise<UploadApiResponse> => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= DEFAULT_UPLOAD_RETRIES; attempt += 1) {
    try {
      return await uploadFn();
    } catch (error) {
      lastError = error;
      if (!isRetryableCloudinaryError(error) || attempt === DEFAULT_UPLOAD_RETRIES) {
        throw error;
      }

      const delayMs = BASE_RETRY_DELAY_MS * 2 ** (attempt - 1);
      console.warn(
        `Cloudinary upload retry ${attempt}/${DEFAULT_UPLOAD_RETRIES} for ${fileLabel} after ${delayMs}ms`
      );
      await sleep(delayMs);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Cloudinary upload failed after retries');
};

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

    uploadWithRetry(
      () =>
        new Promise<UploadApiResponse>((retryResolve, retryReject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result: UploadApiResponse | undefined) => {
              if (error) {
                retryReject(error);
                return;
              }
              if (!result) {
                retryReject(new Error('Cloudinary upload returned no result'));
                return;
              }
              retryResolve(result);
            }
          );

          uploadStream.end(fileBuffer);
        }),
      'buffer upload'
    )
      .then((result) =>
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          size: result.bytes,
          width: result.width,
          height: result.height,
          duration: result.duration,
          resourceType: result.resource_type,
        })
      )
      .catch((error) => reject(new Error(`Cloudinary upload failed: ${(error as Error).message}`)));
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

  const result = await uploadWithRetry(
    () =>
      cloudinary.uploader.upload(filePath, {
        folder: 'multimodal-ai',
        resource_type: 'auto',
        ...options,
      }),
    filePath
  );

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