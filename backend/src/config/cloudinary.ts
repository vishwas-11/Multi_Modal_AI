import { v2 as cloudinary } from 'cloudinary';

let cloudinaryConfigured = false;

const configureCloudinary = (): void => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    cloudinaryConfigured = false;
    console.warn(
      'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to enable uploads.'
    );
    return;
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  cloudinaryConfigured = true;
  console.log(' Cloudinary configured');
};

export const isCloudinaryConfigured = (): boolean => cloudinaryConfigured;
export { cloudinary };
export default configureCloudinary;