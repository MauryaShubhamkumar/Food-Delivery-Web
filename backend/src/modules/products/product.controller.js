import {
  listProductsService, getAdminProductsService,
  createAdminProductService, updateAdminProductService,
  deleteAdminProductService, toggleProductAvailabilityService
} from './product.service.js';

export const listFood = async (req, res, next) => {
  try {
    const data = await listProductsService({ restaurantId: req.query.restaurant_id, slug: req.query.slug });
    res.json({ success: true, count: data.length, data });
  } catch (error) { next(error); }
};

export const getAdminProducts = async (req, res, next) => {
  try {
    const tenantId = req.restaurantId || 1;
    const data = await getAdminProductsService(tenantId, req.query);
    res.json({ success: true, count: data.length, data });
  } catch (error) { next(error); }
};

export const createAdminProduct = async (req, res, next) => {
  try {
    const tenantId = req.restaurantId || 1;
    const data = await createAdminProductService(tenantId, req.body, req.file);
    res.status(201).json({ success: true, message: "Food item created successfully!", data });
  } catch (error) { next(error); }
};

export const updateAdminProduct = async (req, res, next) => {
  try {
    const tenantId = req.restaurantId || 1;
    const data = await updateAdminProductService(tenantId, req.params.id, req.body, req.file);
    res.json({ success: true, message: "Food item updated successfully!", data });
  } catch (error) { next(error); }
};

export const deleteAdminProduct = async (req, res, next) => {
  try {
    const tenantId = req.restaurantId || 1;
    const result = await deleteAdminProductService(tenantId, req.params.id);
    res.json({
      success: true,
      message: result.softDeleted
        ? `"${result.productName}" is referenced in past customer orders. To preserve order history, it has been marked as Unavailable.`
        : `"${result.productName}" deleted successfully!`,
      softDeleted: result.softDeleted
    });
  } catch (error) { next(error); }
};

export const toggleProductAvailability = async (req, res, next) => {
  try {
    const tenantId = req.restaurantId || 1;
    const result = await toggleProductAvailabilityService(tenantId, req.params.id);
    res.json({
      success: true,
      message: `"${result.productName}" status updated to ${result.available ? 'Available' : 'Unavailable'}`,
      available: result.available
    });
  } catch (error) { next(error); }
};
