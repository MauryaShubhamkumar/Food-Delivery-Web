import {
  getPublicCategoriesService, getAdminCategoriesService,
  createAdminCategoryService, updateAdminCategoryService,
  deleteAdminCategoryService, toggleCategoryStatusService
} from './category.service.js';

export const getPublicCategories = async (req, res, next) => {
  try {
    const data = await getPublicCategoriesService({ restaurantId: req.query.restaurant_id, slug: req.query.slug });
    res.json({ success: true, count: data.length, data });
  } catch (error) { next(error); }
};

export const getAdminCategories = async (req, res, next) => {
  try {
    const tenantId = req.restaurantId || 1;
    const data = await getAdminCategoriesService(tenantId, req.query.search);
    res.json({ success: true, count: data.length, data });
  } catch (error) { next(error); }
};

export const createAdminCategory = async (req, res, next) => {
  try {
    const tenantId = req.restaurantId || 1;
    const data = await createAdminCategoryService(tenantId, req.body);
    res.status(201).json({ success: true, message: "Category created successfully!", data });
  } catch (error) { next(error); }
};

export const updateAdminCategory = async (req, res, next) => {
  try {
    const tenantId = req.restaurantId || 1;
    const data = await updateAdminCategoryService(tenantId, req.params.id, req.body);
    res.json({ success: true, message: "Category updated successfully!", data });
  } catch (error) { next(error); }
};

export const deleteAdminCategory = async (req, res, next) => {
  try {
    const tenantId = req.restaurantId || 1;
    const name = await deleteAdminCategoryService(tenantId, req.params.id);
    res.json({ success: true, message: `Category "${name}" deleted successfully!` });
  } catch (error) { next(error); }
};

export const toggleCategoryStatus = async (req, res, next) => {
  try {
    const tenantId = req.restaurantId || 1;
    const result = await toggleCategoryStatusService(tenantId, req.params.id);
    res.json({
      success: true,
      message: `Category "${result.categoryName}" marked as ${result.is_active ? 'Active' : 'Inactive'}`,
      is_active: result.is_active
    });
  } catch (error) { next(error); }
};
