import { getPool } from '../config/db.js';
import { uploadBufferToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';

const ALLOWED_CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'];

// Helper to format settings object
const formatSettingsObj = (s) => ({
  restaurantName: s.restaurant_name || 'FastBite',
  logoUrl: s.logo_url || null,
  logoPublicId: s.logo_public_id || null,
  upiId: s.upi_id || 'shubhamkumarmaurya155@okaxis',
  upiQrUrl: s.upi_qr_url || null,
  upiQrPublicId: s.upi_qr_public_id || null,
  description: s.description || '',
  phone: s.phone || '',
  email: s.email || '',
  address: s.address || '',
  openingTime: s.opening_time || '10:00',
  closingTime: s.closing_time || '22:00',
  isOpen: Boolean(s.is_open),
  deliveryFee: Number(s.delivery_fee !== undefined ? s.delivery_fee : 40.0),
  minimumOrderAmount: Number(s.minimum_order_amount !== undefined ? s.minimum_order_amount : 199.0),
  currency: s.currency || 'INR',
  isActive: Boolean(s.is_active)
});

// GET Public Settings (for Customer App)
export const getPublicSettings = async (req, res, next) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM restaurant_settings LIMIT 1');

    if (rows.length === 0) {
      return res.json({
        success: true,
        data: {
          restaurantName: 'FastBite',
          logoUrl: null,
          upiId: 'shubhamkumarmaurya155@okaxis',
          upiQrUrl: null,
          description: 'Delicious food delivered to your doorstep.',
          phone: '',
          email: '',
          address: '',
          openingTime: '10:00',
          closingTime: '22:00',
          isOpen: true,
          deliveryFee: 40,
          minimumOrderAmount: 199,
          currency: 'INR',
          isActive: true
        }
      });
    }

    res.json({
      success: true,
      data: formatSettingsObj(rows[0])
    });
  } catch (error) {
    next(error);
  }
};

// GET Admin Settings
export const getAdminSettings = async (req, res, next) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM restaurant_settings LIMIT 1');

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Settings record not found' });
    }

    res.json({
      success: true,
      data: formatSettingsObj(rows[0])
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE Admin Settings
export const updateAdminSettings = async (req, res, next) => {
  try {
    const {
      restaurantName,
      description,
      phone,
      email,
      address,
      openingTime,
      closingTime,
      isOpen,
      deliveryFee,
      minimumOrderAmount,
      currency,
      isActive,
      upiId,
      logoUrl: providedLogoUrl,
      upiQrUrl: providedUpiQrUrl
    } = req.body;

    if (!restaurantName || restaurantName.trim() === '') {
      return res.status(400).json({ success: false, message: 'Restaurant name is required' });
    }

    if (deliveryFee !== undefined && (isNaN(deliveryFee) || Number(deliveryFee) < 0)) {
      return res.status(400).json({ success: false, message: 'Delivery fee must be a valid non-negative number' });
    }

    if (minimumOrderAmount !== undefined && (isNaN(minimumOrderAmount) || Number(minimumOrderAmount) < 0)) {
      return res.status(400).json({ success: false, message: 'Minimum order amount must be a valid non-negative number' });
    }

    if (currency && !ALLOWED_CURRENCIES.includes(currency.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Unsupported currency '${currency}'. Allowed currencies: ${ALLOWED_CURRENCIES.join(', ')}`
      });
    }

    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM restaurant_settings LIMIT 1');

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Settings record not found' });
    }

    const current = rows[0];
    let finalLogoUrl = current.logo_url;
    let newLogoPublicId = current.logo_public_id;
    let oldLogoPublicIdToDelete = null;

    let finalUpiQrUrl = current.upi_qr_url;
    let newUpiQrPublicId = current.upi_qr_public_id;
    let oldUpiQrPublicIdToDelete = null;

    // Handle files uploaded via multer fields (logo and upiQr) or single file
    const logoFile = req.files?.logo ? req.files.logo[0] : (req.file?.fieldname === 'logo' ? req.file : null);
    const upiQrFile = req.files?.upiQr ? req.files.upiQr[0] : (req.file?.fieldname === 'upiQr' ? req.file : null);

    if (logoFile) {
      const uploadResult = await uploadBufferToCloudinary(
        logoFile.buffer,
        'FastBite/restaurant',
        'logo'
      );
      finalLogoUrl = uploadResult.secure_url;
      oldLogoPublicIdToDelete = current.logo_public_id;
      newLogoPublicId = uploadResult.public_id;
    } else if (providedLogoUrl !== undefined) {
      finalLogoUrl = providedLogoUrl ? providedLogoUrl.trim() : null;
    }

    if (upiQrFile) {
      const uploadResult = await uploadBufferToCloudinary(
        upiQrFile.buffer,
        'FastBite/restaurant/payment',
        'upi_qr'
      );
      finalUpiQrUrl = uploadResult.secure_url;
      oldUpiQrPublicIdToDelete = current.upi_qr_public_id;
      newUpiQrPublicId = uploadResult.public_id;
    } else if (providedUpiQrUrl !== undefined) {
      finalUpiQrUrl = providedUpiQrUrl ? providedUpiQrUrl.trim() : null;
    }

    const cleanName = restaurantName.trim();
    const cleanPhone = phone ? phone.trim() : '';
    const cleanEmail = email ? email.trim() : '';
    const cleanAddress = address ? address.trim() : '';
    const cleanDesc = description ? description.trim() : '';
    const cleanOpenTime = openingTime ? openingTime.trim() : '10:00';
    const cleanCloseTime = closingTime ? closingTime.trim() : '22:00';
    const openVal = isOpen === true || isOpen === 'true' || isOpen === 1 ? 1 : 0;
    const activeVal = isActive === false || isActive === 'false' || isActive === 0 ? 0 : 1;
    const cleanCurrency = currency ? currency.toUpperCase() : 'INR';
    const cleanUpiId = upiId ? upiId.trim() : (current.upi_id || 'shubhamkumarmaurya155@okaxis');

    await pool.query(
      `UPDATE restaurant_settings SET
        restaurant_name = ?,
        logo_url = ?,
        logo_public_id = ?,
        upi_id = ?,
        upi_qr_url = ?,
        upi_qr_public_id = ?,
        description = ?,
        phone = ?,
        email = ?,
        address = ?,
        opening_time = ?,
        closing_time = ?,
        is_open = ?,
        delivery_fee = ?,
        minimum_order_amount = ?,
        currency = ?,
        is_active = ?
      WHERE id = ?`,
      [
        cleanName,
        finalLogoUrl,
        newLogoPublicId,
        cleanUpiId,
        finalUpiQrUrl,
        newUpiQrPublicId,
        cleanDesc,
        cleanPhone,
        cleanEmail,
        cleanAddress,
        cleanOpenTime,
        cleanCloseTime,
        openVal,
        Number(deliveryFee !== undefined ? deliveryFee : current.delivery_fee),
        Number(minimumOrderAmount !== undefined ? minimumOrderAmount : current.minimum_order_amount),
        cleanCurrency,
        activeVal,
        current.id
      ]
    );

    // Delete old Cloudinary logo asset if replaced
    if (oldLogoPublicIdToDelete) {
      await deleteFromCloudinary(oldLogoPublicIdToDelete);
    }

    // Delete old Cloudinary UPI QR asset if replaced
    if (oldUpiQrPublicIdToDelete) {
      await deleteFromCloudinary(oldUpiQrPublicIdToDelete);
    }

    const [updatedRows] = await pool.query('SELECT * FROM restaurant_settings WHERE id = ?', [current.id]);

    res.json({
      success: true,
      message: 'Restaurant settings updated successfully!',
      data: formatSettingsObj(updatedRows[0])
    });
  } catch (error) {
    next(error);
  }
};
