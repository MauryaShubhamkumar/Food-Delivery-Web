import {
  findPublicCategories, findAdminCategories, findCategoryById,
  findCategoryByName, createCategory, updateCategory, syncFoodItemsCategory,
  getProductCountForCategory, deleteCategory, toggleCategoryStatusRepo,
  getRestaurantIdBySlug
} from './category.repository.js';

export const getPublicCategoriesService = async ({ restaurantId, slug }) => {
  let targetId = restaurantId ? Number(restaurantId) : 1;
  if (slug && slug.trim()) {
    const found = await getRestaurantIdBySlug(slug);
    if (found) targetId = found;
  }
  return await findPublicCategories(targetId);
};

export const getAdminCategoriesService = async (tenantId, search) => {
  const rows = await findAdminCategories(tenantId, search);
  return rows.map(item => ({
    ...item,
    is_active: Boolean(item.is_active),
    product_count: Number(item.product_count || 0)
  }));
};

export const createAdminCategoryService = async (tenantId, { name, description, is_active }) => {
  if (!name || name.trim() === '') {
    const e = new Error("Category name is required"); e.statusCode = 400; throw e;
  }
  const cleanName = name.trim();
  if (cleanName.length > 255) {
    const e = new Error("Category name exceeds maximum length of 255 characters"); e.statusCode = 400; throw e;
  }
  const existing = await findCategoryByName(tenantId, cleanName);
  if (existing) {
    const e = new Error("A category with this name already exists in your restaurant."); e.statusCode = 400; throw e;
  }
  const activeStatus = (is_active === false || is_active === 'false' || is_active === 0 || is_active === '0') ? 0 : 1;
  const newId = await createCategory(tenantId, { name: cleanName, description, isActive: activeStatus });
  const created = await findCategoryById(newId, tenantId);
  return { ...created, is_active: Boolean(created.is_active), product_count: 0 };
};

export const updateAdminCategoryService = async (tenantId, categoryId, { name, description, is_active }) => {
  if (!name || name.trim() === '') {
    const e = new Error("Category name is required"); e.statusCode = 400; throw e;
  }
  const cleanName = name.trim();
  const current = await findCategoryById(categoryId, tenantId);
  if (!current) {
    const e = new Error("Category not found or access denied"); e.statusCode = 404; throw e;
  }
  const duplicate = await findCategoryByName(tenantId, cleanName, categoryId);
  if (duplicate) {
    const e = new Error("A category with this name already exists in your restaurant."); e.statusCode = 400; throw e;
  }
  const activeStatus = (is_active === false || is_active === 'false' || is_active === 0 || is_active === '0') ? 0 : 1;
  await updateCategory(categoryId, tenantId, { name: cleanName, description, isActive: activeStatus });
  if (current.name !== cleanName) {
    await syncFoodItemsCategory(tenantId, categoryId, current.name, cleanName);
  }
  const updated = await findCategoryById(categoryId, tenantId);
  return { ...updated, is_active: Boolean(updated.is_active) };
};

export const deleteAdminCategoryService = async (tenantId, categoryId) => {
  const category = await findCategoryById(categoryId, tenantId);
  if (!category) {
    const e = new Error("Category not found or access denied"); e.statusCode = 404; throw e;
  }
  const productCount = await getProductCountForCategory(tenantId, categoryId, category.name);
  if (productCount > 0) {
    const e = new Error(`Category "${category.name}" contains ${productCount} product${productCount > 1 ? 's' : ''}. You cannot delete this category until its products are reassigned to another category, or deactivate it instead.`);
    e.statusCode = 400; throw e;
  }
  await deleteCategory(categoryId, tenantId);
  return category.name;
};

export const toggleCategoryStatusService = async (tenantId, categoryId) => {
  const category = await findCategoryById(categoryId, tenantId);
  if (!category) {
    const e = new Error("Category not found or access denied"); e.statusCode = 404; throw e;
  }
  const newStatus = !Boolean(category.is_active);
  await toggleCategoryStatusRepo(categoryId, tenantId, newStatus);
  return { categoryName: category.name, is_active: newStatus };
};
