import { uploadBufferToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';

export const uploadImage = async (buffer, folderName, publicId = null) => {
  return await uploadBufferToCloudinary(buffer, folderName, publicId);
};

export const deleteImage = async (publicId) => {
  if (!publicId) return null;
  return await deleteFromCloudinary(publicId);
};
