import {
  getUserById,
  updateUserProfile,
  updateUserAvatar,
  removeUserAvatar,
  getAdminUsersRepo,
  updateUserStatusRepo
} from './user.repository.js';
import { uploadImage, deleteImage } from '../../services/cloudinary.service.js';
import { normalizeRole, ROLE_PERMISSIONS } from '../../config/permissions.js';
import { validateProfilePayload } from '../../utils/addressValidator.js';

export const getProfileService = async (userId) => {
  const user = await getUserById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  const normRole = normalizeRole(user.role);
  return {
    ...user,
    role: normRole,
    permissions: ROLE_PERMISSIONS[normRole] || []
  };
};

export const updateProfileService = async (userId, data) => {
  const validation = validateProfilePayload(data);
  if (!validation.isValid) {
    const error = new Error(validation.message || "Invalid profile information.");
    error.statusCode = 400;
    error.errors = validation.errors;
    throw error;
  }
  return await updateUserProfile(userId, data);
};

export const updateAvatarService = async (userId, file) => {
  if (!file) {
    const error = new Error("Please select an image file to upload");
    error.statusCode = 400;
    throw error;
  }

  const user = await getUserById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const uploadResult = await uploadImage(file.buffer, 'FastBite/avatars', `user_${userId}`);
  if (user.avatar_public_id) {
    await deleteImage(user.avatar_public_id);
  }

  return await updateUserAvatar(userId, uploadResult.secure_url, uploadResult.public_id);
};

export const removeAvatarService = async (userId) => {
  const user = await getUserById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  if (user.avatar_public_id) {
    await deleteImage(user.avatar_public_id);
  }

  return await removeUserAvatar(userId);
};

export const getAdminUsersService = async ({ tenantId, search, status, page = 1, limit = 20 }) => {
  const cleanPage = Math.max(1, parseInt(page) || 1);
  const cleanLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));

  const { total, rows } = await getAdminUsersRepo({ tenantId, search, status, page: cleanPage, limit: cleanLimit });
  const totalPages = Math.ceil(total / cleanLimit) || 1;

  const formattedUsers = rows.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role || 'customer',
    isActive: u.is_active === undefined || u.is_active === null ? true : Boolean(u.is_active),
    phone: u.phone || 'N/A',
    address: u.address || 'N/A',
    totalOrders: Number(u.totalOrders || 0),
    totalSpent: Number(u.totalSpent || 0),
    createdAt: u.created_at
  }));

  return {
    count: formattedUsers.length,
    page: cleanPage,
    limit: cleanLimit,
    total,
    totalPages,
    data: formattedUsers
  };
};

export const updateAdminUserStatusService = async (adminUserId, targetUserId, isActive) => {
  if (isActive === undefined) {
    const error = new Error("Account status boolean is required");
    error.statusCode = 400;
    throw error;
  }

  if (Number(adminUserId) === Number(targetUserId)) {
    const error = new Error("You cannot deactivate your own admin account.");
    error.statusCode = 400;
    throw error;
  }

  const user = await getUserById(targetUserId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  if (user.role === 'admin' && !isActive) {
    const error = new Error("Admin accounts cannot be deactivated from customer management.");
    error.statusCode = 400;
    throw error;
  }

  await updateUserStatusRepo(targetUserId, Boolean(isActive));
  return {
    userName: user.name,
    isActive: Boolean(isActive)
  };
};
