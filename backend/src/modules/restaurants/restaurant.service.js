import { getPool } from '../../config/db.js';
import { getRestaurantById, getRestaurantBySlug, createRestaurantRepo, associateOwnerRepo } from './restaurant.repository.js';
import { uploadImage, deleteImage } from '../../services/cloudinary.service.js';

const generateUniqueSlug = async (baseName, pool, currentRestaurantId = null) => {
  let slug = baseName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!slug) slug = 'restaurant';

  let candidateSlug = slug;
  let counter = 1;
  let isUnique = false;

  while (!isUnique && counter < 100) {
    const [existing] = await pool.query(
      'SELECT id FROM restaurants WHERE slug = ? AND (? IS NULL OR id != ?)',
      [candidateSlug, currentRestaurantId, currentRestaurantId]
    );

    if (existing.length === 0) {
      isUnique = true;
    } else {
      counter++;
      candidateSlug = `${slug}-${counter}`;
    }
  }

  return candidateSlug;
};

export const createRestaurantService = async (userId, { name, email, phone, address, city, state, pincode }) => {
  if (!name || name.trim() === '') {
    const error = new Error("Restaurant name is required.");
    error.statusCode = 400;
    throw error;
  }

  const pool = getPool();
  const [userRows] = await pool.query('SELECT restaurant_id, role FROM users WHERE id = ?', [userId]);
  if (userRows.length === 0) {
    const error = new Error("User account not found.");
    error.statusCode = 404;
    throw error;
  }

  if (userRows[0].restaurant_id) {
    const error = new Error("You already have a restaurant associated with this account.");
    error.statusCode = 400;
    throw error;
  }

  const cleanName = name.trim();
  const slug = await generateUniqueSlug(cleanName, pool);

  const newRestaurantId = await createRestaurantRepo({
    name: cleanName,
    slug,
    email: email ? email.trim() : null,
    phone: phone ? phone.trim() : null,
    address: address ? address.trim() : null,
    city: city ? city.trim() : null,
    state: state ? state.trim() : null,
    pincode: pincode ? pincode.trim() : null
  });

  await associateOwnerRepo(userId, newRestaurantId);

  await pool.query(
    `INSERT INTO restaurant_settings (
      restaurant_id, restaurant_name, email, phone, address, delivery_fee, minimum_order_amount, currency
    ) VALUES (?, ?, ?, ?, ?, 40.00, 199.00, 'INR')`,
    [
      newRestaurantId,
      cleanName,
      email ? email.trim() : '',
      phone ? phone.trim() : '',
      address ? address.trim() : ''
    ]
  );

  const createdRest = await getRestaurantById(newRestaurantId);
  return {
    ...createdRest,
    onboarding_completed: Boolean(createdRest.onboarding_completed)
  };
};

export const getMyRestaurantService = async (tenantId) => {
  if (!tenantId) {
    return { hasRestaurant: false, restaurant: null };
  }

  const restaurant = await getRestaurantById(tenantId);
  if (!restaurant) {
    return { hasRestaurant: false, restaurant: null };
  }

  const pool = getPool();
  const [[settingsRows], [catCountRows], [prodCountRows]] = await Promise.all([
    pool.query('SELECT * FROM restaurant_settings WHERE restaurant_id = ? LIMIT 1', [tenantId]),
    pool.query('SELECT COUNT(id) as count FROM categories WHERE restaurant_id = ?', [tenantId]),
    pool.query('SELECT COUNT(id) as count FROM food_items WHERE restaurant_id = ?', [tenantId])
  ]);

  return {
    hasRestaurant: true,
    data: {
      ...restaurant,
      onboarding_completed: Boolean(restaurant.onboarding_completed),
      settings: settingsRows[0] || null,
      stats: {
        categoryCount: Number(catCountRows[0]?.count || 0),
        productCount: Number(prodCountRows[0]?.count || 0)
      }
    }
  };
};

export const updateOnboardingService = async (tenantId, { step, name, email, phone, address, city, state, pincode, upiId }) => {
  if (!tenantId) {
    const error = new Error("No restaurant associated with your account.");
    error.statusCode = 400;
    throw error;
  }

  const currentRest = await getRestaurantById(tenantId);
  if (!currentRest) {
    const error = new Error("Restaurant not found.");
    error.statusCode = 404;
    throw error;
  }

  const currentStep = currentRest.onboarding_step || 1;
  const nextStep = step ? Math.max(currentStep, Number(step)) : currentStep;

  const cleanName = name ? name.trim() : currentRest.name;
  const cleanEmail = email !== undefined ? (email ? email.trim() : null) : currentRest.email;
  const cleanPhone = phone !== undefined ? (phone ? phone.trim() : null) : currentRest.phone;
  const cleanAddress = address !== undefined ? (address ? address.trim() : null) : currentRest.address;
  const cleanCity = city !== undefined ? (city ? city.trim() : null) : currentRest.city;
  const cleanState = state !== undefined ? (state ? state.trim() : null) : currentRest.state;
  const cleanPincode = pincode !== undefined ? (pincode ? pincode.trim() : null) : currentRest.pincode;

  const pool = getPool();
  await pool.query(
    `UPDATE restaurants SET
      name = ?, email = ?, phone = ?, address = ?, city = ?, state = ?, pincode = ?, onboarding_step = ?
    WHERE id = ?`,
    [cleanName, cleanEmail, cleanPhone, cleanAddress, cleanCity, cleanState, cleanPincode, nextStep, tenantId]
  );

  if (name || email || phone || address || upiId) {
    const [settingRows] = await pool.query('SELECT * FROM restaurant_settings WHERE restaurant_id = ? LIMIT 1', [tenantId]);
    if (settingRows.length > 0) {
      const cleanUpi = upiId !== undefined ? (upiId ? upiId.trim() : settingRows[0].upi_id) : settingRows[0].upi_id;
      await pool.query(
        `UPDATE restaurant_settings SET
          restaurant_name = ?, email = ?, phone = ?, address = ?, upi_id = ?
        WHERE restaurant_id = ?`,
        [cleanName, cleanEmail || '', cleanPhone || '', cleanAddress || '', cleanUpi, tenantId]
      );
    }
  }

  const updatedRest = await getRestaurantById(tenantId);
  return {
    ...updatedRest,
    onboarding_completed: Boolean(updatedRest.onboarding_completed)
  };
};

export const uploadRestaurantLogoService = async (tenantId, file) => {
  if (!tenantId) {
    const error = new Error("No restaurant associated with your account.");
    error.statusCode = 400;
    throw error;
  }

  if (!file) {
    const error = new Error("Please select an image file to upload.");
    error.statusCode = 400;
    throw error;
  }

  const restaurant = await getRestaurantById(tenantId);
  if (!restaurant) {
    const error = new Error("Restaurant not found.");
    error.statusCode = 404;
    throw error;
  }

  const oldPublicId = restaurant.logo_public_id;
  const uploadResult = await uploadImage(file.buffer, `FastBite/restaurant_${tenantId}/logo`, 'logo');

  const pool = getPool();
  await pool.query(
    'UPDATE restaurants SET logo_url = ?, logo_public_id = ? WHERE id = ?',
    [uploadResult.secure_url, uploadResult.public_id, tenantId]
  );

  await pool.query(
    'UPDATE restaurant_settings SET logo_url = ?, logo_public_id = ? WHERE restaurant_id = ?',
    [uploadResult.secure_url, uploadResult.public_id, tenantId]
  );

  if (oldPublicId) {
    await deleteImage(oldPublicId);
  }

  return {
    logoUrl: uploadResult.secure_url,
    publicId: uploadResult.public_id
  };
};

export const launchRestaurantService = async (tenantId) => {
  if (!tenantId) {
    const error = new Error("No restaurant associated with your account.");
    error.statusCode = 400;
    throw error;
  }

  const restaurant = await getRestaurantById(tenantId);
  if (!restaurant) {
    const error = new Error("Restaurant not found.");
    error.statusCode = 404;
    throw error;
  }

  const pool = getPool();
  const [[catRows], [prodRows], [settingRows]] = await Promise.all([
    pool.query('SELECT COUNT(id) as count FROM categories WHERE restaurant_id = ?', [tenantId]),
    pool.query('SELECT COUNT(id) as count FROM food_items WHERE restaurant_id = ?', [tenantId]),
    pool.query('SELECT upi_id FROM restaurant_settings WHERE restaurant_id = ? LIMIT 1', [tenantId])
  ]);

  const catCount = Number(catRows[0]?.count || 0);
  const prodCount = Number(prodRows[0]?.count || 0);
  const upiId = settingRows[0]?.upi_id || '';

  const missingItems = [];
  if (!restaurant.name) missingItems.push("Provide restaurant name");
  if (catCount === 0) missingItems.push("Add at least one food category");
  if (prodCount === 0) missingItems.push("Add at least one product item");
  if (!upiId || upiId.trim() === '') missingItems.push("Configure valid UPI payment ID");

  if (missingItems.length > 0) {
    const error = new Error(`Cannot launch restaurant yet. Please complete: ${missingItems.join('; ')}`);
    error.statusCode = 400;
    error.missingItems = missingItems;
    throw error;
  }

  await pool.query(
    "UPDATE restaurants SET status = 'active', onboarding_completed = TRUE, onboarding_step = 6 WHERE id = ?",
    [tenantId]
  );

  const updatedRest = await getRestaurantById(tenantId);
  return {
    restaurantName: restaurant.name,
    slug: restaurant.slug,
    data: {
      ...updatedRest,
      onboarding_completed: true
    }
  };
};

export const getPublicRestaurantBySlugService = async (slug) => {
  if (!slug || !slug.trim()) {
    const error = new Error("Restaurant slug is required.");
    error.statusCode = 400;
    throw error;
  }

  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant) {
    const error = new Error("Restaurant not found.");
    error.statusCode = 404;
    throw error;
  }

  if (restaurant.status !== 'active') {
    return {
      isAvailable: false,
      status: restaurant.status,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        logo_url: restaurant.logo_url
      }
    };
  }

  const pool = getPool();
  const [[settingRows], [reviewRows]] = await Promise.all([
    pool.query(
      `SELECT upi_id, upi_qr_url, delivery_fee, minimum_order_amount, currency, is_open,
              opening_time, closing_time,
              phone AS settings_phone, email AS settings_email,
              address AS settings_address, restaurant_name, description
       FROM restaurant_settings WHERE restaurant_id = ? LIMIT 1`,
      [restaurant.id]
    ),
    pool.query(
      'SELECT AVG(rating) as avgRating, COUNT(id) as totalReviews FROM reviews WHERE restaurant_id = ? AND (is_visible IS NULL OR is_visible = TRUE)',
      [restaurant.id]
    )
  ]);

  const s = settingRows[0] || {};
  const settings = {
    delivery_fee: Number(s.delivery_fee || 40.00),
    minimum_order_amount: Number(s.minimum_order_amount || 199.00),
    currency: s.currency || 'INR',
    is_open: s.is_open === undefined ? true : Boolean(s.is_open),
    opening_time: s.opening_time || '10:00',
    closing_time: s.closing_time || '22:00',
    upi_id: s.upi_id || null,
    upi_qr_url: s.upi_qr_url || null,
    description: s.description || null,
    // Contact info — prefer settings override, fall back to restaurants table
    phone: s.settings_phone || restaurant.phone || null,
    email: s.settings_email || restaurant.email || null,
    address: s.settings_address || restaurant.address || null
  };

  const avgRating = reviewRows[0]?.avgRating ? Number(reviewRows[0].avgRating).toFixed(1) : null;
  const totalReviews = Number(reviewRows[0]?.totalReviews || 0);

  return {
    isAvailable: true,
    data: {
      ...restaurant,
      rating: avgRating,
      totalReviews,
      settings
    }
  };
};

export const listPublicRestaurantsService = async () => {
  const { getPublicRestaurants } = await import('./restaurant.repository.js');
  const rows = await getPublicRestaurants();
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    logo_url: r.logo_url,
    email: r.email,
    phone: r.phone,
    address: r.address,
    city: r.city,
    state: r.state,
    status: r.status,
    product_count: Number(r.product_count || 0),
    rating: Number(Number(r.rating || 4.8).toFixed(1)),
    review_count: Number(r.review_count || 0),
    settings: {
      opening_time: r.opening_time || '10:00',
      closing_time: r.closing_time || '22:00',
      is_open: r.is_open === undefined ? true : Boolean(r.is_open),
      delivery_fee: Number(r.delivery_fee || 40.00),
      minimum_order_amount: Number(r.minimum_order_amount || 199.00)
    }
  }));
};
