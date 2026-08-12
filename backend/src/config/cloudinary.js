import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { Readable } from 'stream';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const uploadBufferToCloudinary = (buffer, folderName = 'FastBite', publicId = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      folder: folderName,
      resource_type: 'auto'
    };

    if (publicId) {
      options.public_id = publicId;
      options.invalidate = true;
    }

    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });

    const readable = new Readable();
    readable._read = () => {};
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

export const deleteFromCloudinary = (publicId) => {
  return new Promise((resolve, reject) => {
    if (!publicId) return resolve(null);

    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
  });
};

export default cloudinary;
