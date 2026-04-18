import { UploadApiResponse, UploadApiOptions } from 'cloudinary';
import { cloudinary } from '../config/cloudinary';

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
  return cloudinary.url(publicId, {
    secure: true,
    ...transformations,
  });
};