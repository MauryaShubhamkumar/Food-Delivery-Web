import {
  findProductsByRestaurant, findPublicProducts, findProductById,
  createProduct, createProductInventory, updateProduct,
  deleteProduct, softDeleteProduct, getOrderRefCount,
  toggleProductAvailabilityRepo, getRestaurantIdBySlug
} from './product.repository.js';
import { uploadImage, deleteImage } from '../../services/cloudinary.service.js';

export const listProductsService = async ({ restaurantId, slug }) => {
  let targetId = restaurantId ? Number(restaurantId) : 1;
  if (slug && slug.trim()) {
    const foundId = await getRestaurantIdBySlug(slug);
    if (foundId) targetId = foundId;
  }
  const foods = await findPublicProducts(targetId);
  return foods.map(f => {
    const qty = Number(f.quantity);
    const minStock = Number(f.minimum_stock);
    let stockStatus = 'IN_STOCK';
    if (qty === 0) stockStatus = 'OUT_OF_STOCK';
    else if (qty <= minStock) stockStatus = 'LOW_STOCK';
    return {
      ...f,
      quantity: qty,
      minimum_stock: minStock,
      stockStatus,
      available: f.available === undefined ? (qty > 0) : (Boolean(f.available) && qty > 0)
    };
  });
};

export const getAdminProductsService = async (tenantId, filters) => {
  const rows = await findProductsByRestaurant(tenantId, filters);
  return rows.map(item => ({ ...item, available: Boolean(item.available) }));
};

export const createAdminProductService = async (tenantId, body, file) => {
  const { name, description, price, category, available, imageUrl } = body;
  if (!name || name.trim() === '') {
    const e = new Error("Food name is required"); e.statusCode = 400; throw e;
  }
  if (price === undefined || price === null || isNaN(price) || Number(price) < 0) {
    const e = new Error("Valid price (≥ 0) is required"); e.statusCode = 400; throw e;
  }
  if (!category || category.trim() === '') {
    const e = new Error("Category is required"); e.statusCode = 400; throw e;
  }

  let image = imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80";
  let cloudinaryPublicId = null;

  if (file) {
    const uploadResult = await uploadImage(file.buffer, `FastBite/restaurant_${tenantId}/products`, file.originalname || name.trim());
    image = uploadResult.secure_url;
    cloudinaryPublicId = uploadResult.public_id;
  }

  const isAvailable = (available === 'false' || available === false || available === 0 || available === '0') ? 0 : 1;
  const initialQty = body.quantity !== undefined && !isNaN(body.quantity) ? Math.max(0, Number(body.quantity)) : 50;
  const minStockVal = body.minimumStock !== undefined && !isNaN(body.minimumStock) ? Math.max(0, Number(body.minimumStock)) : 5;

  const productId = await createProduct(tenantId, { name: name.trim(), description: description?.trim(), price, category: category.trim(), image, cloudinaryPublicId, isAvailable });
  await createProductInventory(productId, tenantId, initialQty, minStockVal);

  const newProduct = await findProductById(productId, tenantId);
  return { ...newProduct, available: Boolean(newProduct.available) };
};

export const updateAdminProductService = async (tenantId, productId, body, file) => {
  const { name, description, price, category, available, imageUrl } = body;
  if (!name || name.trim() === '') {
    const e = new Error("Food name is required"); e.statusCode = 400; throw e;
  }
  if (price === undefined || price === null || isNaN(price) || Number(price) < 0) {
    const e = new Error("Valid price (≥ 0) is required"); e.statusCode = 400; throw e;
  }
  if (!category || category.trim() === '') {
    const e = new Error("Category is required"); e.statusCode = 400; throw e;
  }

  const currentProduct = await findProductById(productId, tenantId);
  if (!currentProduct) {
    const e = new Error("Food item not found or access denied"); e.statusCode = 404; throw e;
  }

  let image = currentProduct.image;
  let newCloudinaryPublicId = currentProduct.cloudinary_public_id;
  let oldPublicId = null;

  if (file) {
    const uploadResult = await uploadImage(file.buffer, `FastBite/restaurant_${tenantId}/products`, file.originalname || name.trim());
    image = uploadResult.secure_url;
    oldPublicId = currentProduct.cloudinary_public_id;
    newCloudinaryPublicId = uploadResult.public_id;
  } else if (imageUrl && imageUrl.trim() !== '') {
    image = imageUrl.trim();
  }

  const isAvailable = (available === 'false' || available === false || available === 0 || available === '0') ? 0 : 1;
  await updateProduct(productId, tenantId, { name: name.trim(), description: description?.trim(), price, category: category.trim(), image, cloudinaryPublicId: newCloudinaryPublicId, isAvailable });
  if (oldPublicId) await deleteImage(oldPublicId);

  const updatedProduct = await findProductById(productId, tenantId);
  return { ...updatedProduct, available: Boolean(updatedProduct.available) };
};

export const deleteAdminProductService = async (tenantId, productId) => {
  const product = await findProductById(productId, tenantId);
  if (!product) {
    const e = new Error("Food item not found or access denied"); e.statusCode = 404; throw e;
  }
  const refCount = await getOrderRefCount(productId);
  if (refCount > 0) {
    await softDeleteProduct(productId, tenantId);
    return { softDeleted: true, productName: product.name };
  }
  if (product.cloudinary_public_id) await deleteImage(product.cloudinary_public_id);
  await deleteProduct(productId, tenantId);
  return { softDeleted: false, productName: product.name };
};

export const toggleProductAvailabilityService = async (tenantId, productId) => {
  const product = await findProductById(productId, tenantId);
  if (!product) {
    const e = new Error("Food item not found or access denied"); e.statusCode = 404; throw e;
  }
  const newAvailability = !Boolean(product.available);
  await toggleProductAvailabilityRepo(productId, tenantId, newAvailability);
  return { productName: product.name, available: newAvailability };
};
