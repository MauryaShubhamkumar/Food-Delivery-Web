import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * Uploads an in-memory file buffer (from Multer memoryStorage) to Cloudinary.
 * @param {Buffer} buffer - File buffer
 * @param {string} folder - Target Cloudinary folder (e.g. "FastBite/products")
 * @param {string} [filenameHint] - Optional filename hint for public_id
 * @returns {Promise<{ secure_url: string, public_id: string }>}
 */
export const uploadBufferToCloudinary = (buffer, folder = 'FastBite/uploads', filenameHint = '') => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder,
      resource_type: 'auto'
    };

    if (filenameHint) {
      const cleanName = filenameHint
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_');
      uploadOptions.public_id = `${cleanName}_${Date.now()}`;
    }

    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id
        });
      }
    );

    stream.end(buffer);
  });
};

/**
 * Uploads a local file path to Cloudinary (used during one-time migration).
 * @param {string} filePath - Absolute or relative path to local image file
 * @param {string} folder - Target Cloudinary folder
 * @param {string} [filenameHint] - Optional public_id hint
 * @returns {Promise<{ secure_url: string, public_id: string }>}
 */
export const uploadFilePathToCloudinary = async (filePath, folder = 'FastBite/uploads', filenameHint = '') => {
  const options = {
    folder,
    resource_type: 'auto'
  };

  if (filenameHint) {
    const cleanName = filenameHint
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    options.public_id = `${cleanName}_${Date.now()}`;
  }

  const result = await cloudinary.uploader.upload(filePath, options);
  return {
    secure_url: result.secure_url,
    public_id: result.public_id
  };
};

/**
 * Safely deletes an image asset from Cloudinary using its public_id.
 * @param {string} publicId - Cloudinary public_id
 * @returns {Promise<any>}
 */
export const deleteFromCloudinary = async (publicId) => {
  if (!publicId || typeof publicId !== 'string') return null;
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error(`Error deleting Cloudinary asset "${publicId}":`, error.message);
    return null;
  }
};

export default cloudinary;
