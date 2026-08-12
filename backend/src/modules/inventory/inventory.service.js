import {
  ensureInventoryRecords, findInventoryList, getInventorySummaryRepo,
  findInventoryByProduct, createInventory, updateInventory,
  logInventoryTransaction, syncFoodItemAvailability, findInventoryHistory,
  findFoodItemByIdAndTenant
} from './inventory.repository.js';

export const getAdminInventoryService = async (tenantId, query) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 15));
  const { search, status, sort = 'updated_desc' } = query;
  await ensureInventoryRecords(tenantId);
  const { totalCount, rows } = await findInventoryList(tenantId, { search, status, sort, page, limit });
  const totalPages = Math.ceil(totalCount / limit) || 1;
  const formattedData = rows.map(r => {
    const qty = Number(r.quantity); const minStock = Number(r.minimumStock);
    let stockStatus = 'IN_STOCK';
    if (qty === 0) stockStatus = 'OUT_OF_STOCK'; else if (qty <= minStock) stockStatus = 'LOW_STOCK';
    return { ...r, quantity: qty, minimumStock: minStock, price: Number(r.price), manualAvailable: Boolean(r.manualAvailable), stockStatus };
  });
  return { count: formattedData.length, totalCount, totalPages, currentPage: page, data: formattedData };
};

export const getInventorySummaryService = async (tenantId) => {
  await ensureInventoryRecords(tenantId);
  const stats = await getInventorySummaryRepo(tenantId);
  return { totalProducts: Number(stats.totalProducts || 0), inStock: Number(stats.inStock || 0), lowStock: Number(stats.lowStock || 0), outOfStock: Number(stats.outOfStock || 0) };
};

export const updateAdminStockService = async (tenantId, productId, { quantity, minimumStock, reason }, userId) => {
  if (quantity === undefined || quantity === null || isNaN(quantity) || Number(quantity) < 0) { const e = new Error('Quantity must be a valid number >= 0'); e.statusCode = 400; throw e; }
  if (minimumStock !== undefined && (isNaN(minimumStock) || Number(minimumStock) < 0)) { const e = new Error('Minimum stock must be a valid number >= 0'); e.statusCode = 400; throw e; }
  const food = await findFoodItemByIdAndTenant(productId, tenantId);
  if (!food) { const e = new Error('Product not found or access denied'); e.statusCode = 404; throw e; }
  const newQty = Number(quantity);
  const newMinStock = minimumStock !== undefined ? Number(minimumStock) : 5;
  const cleanReason = reason && typeof reason === 'string' ? reason.trim() : 'Manual stock update by restaurant admin';
  const inv = await findInventoryByProduct(productId, tenantId);
  let invId; let prevQty = 0;
  if (!inv) { invId = await createInventory(productId, tenantId, newQty, newMinStock); }
  else { invId = inv.id; prevQty = Number(inv.quantity); await updateInventory(invId, tenantId, newQty, newMinStock); }
  const diff = newQty - prevQty;
  const txType = diff >= 0 ? 'RESTOCK' : 'MANUAL_ADJUSTMENT';
  await logInventoryTransaction({ invId, productId, tenantId, txType, diff, prevQty, newQty, reason: cleanReason, userId });
  await syncFoodItemAvailability(productId, tenantId, newQty > 0 ? 1 : 0);
  return { productId: Number(productId), productName: food.name, quantity: newQty, minimumStock: newMinStock, stockStatus: newQty === 0 ? 'OUT_OF_STOCK' : (newQty <= newMinStock ? 'LOW_STOCK' : 'IN_STOCK') };
};

export const getInventoryHistoryService = async (tenantId, productId, query) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 15));
  const { totalCount, rows } = await findInventoryHistory(tenantId, productId, { page, limit });
  return { count: rows.length, totalCount, totalPages: Math.ceil(totalCount / limit) || 1, currentPage: page, data: rows };
};
