import { UploadApiOptions } from 'cloudinary';
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
export declare const uploadToCloudinary: (fileBuffer: Buffer, options?: Partial<UploadApiOptions>) => Promise<CloudinaryUploadResult>;
/**
 * Upload from a local file path
 */
export declare const uploadFilePathToCloudinary: (filePath: string, options?: Partial<UploadApiOptions>) => Promise<CloudinaryUploadResult>;
/**
 * Delete a file from Cloudinary
 */
export declare const deleteFromCloudinary: (publicId: string, resourceType?: "image" | "video" | "raw") => Promise<void>;
/**
 * Get a transformation URL for an image
 */
export declare const getTransformedUrl: (publicId: string, transformations: Record<string, string | number>) => string;
/**
 * Get a signed delivery URL (useful when raw assets are ACL-restricted).
 */
export declare const getSignedDeliveryUrl: (publicId: string, resourceType?: "image" | "video" | "raw") => string;
/**
 * Get a private download URL for ACL-restricted assets.
 */
export declare const getPrivateDownloadUrl: (publicId: string, format: string, resourceType?: "image" | "video" | "raw", deliveryType?: "upload" | "private" | "authenticated") => string;
//# sourceMappingURL=cloudinaryService.d.ts.map