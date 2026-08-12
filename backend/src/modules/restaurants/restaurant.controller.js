import {
  createRestaurantService,
  getMyRestaurantService,
  updateOnboardingService,
  uploadRestaurantLogoService,
  launchRestaurantService,
  getPublicRestaurantBySlugService,
  listPublicRestaurantsService
} from './restaurant.service.js';

export const listRestaurants = async (req, res, next) => {
  try {
    const data = await listPublicRestaurantsService();
    res.json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    next(error);
  }
};

export const createRestaurant = async (req, res, next) => {
  try {
    const data = await createRestaurantService(req.userId, req.body);
    res.status(201).json({
      success: true,
      message: "Restaurant created successfully!",
      data
    });
  } catch (error) {
    next(error);
  }
};

export const getMyRestaurant = async (req, res, next) => {
  try {
    const result = await getMyRestaurantService(req.restaurantId);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

export const updateOnboarding = async (req, res, next) => {
  try {
    const data = await updateOnboardingService(req.restaurantId, req.body);
    res.json({
      success: true,
      message: "Onboarding progress saved successfully!",
      data
    });
  } catch (error) {
    next(error);
  }
};

export const uploadRestaurantLogo = async (req, res, next) => {
  try {
    const result = await uploadRestaurantLogoService(req.restaurantId, req.file);
    res.json({
      success: true,
      message: "Restaurant logo uploaded successfully!",
      logoUrl: result.logoUrl,
      publicId: result.publicId
    });
  } catch (error) {
    next(error);
  }
};

export const launchRestaurant = async (req, res, next) => {
  try {
    const result = await launchRestaurantService(req.restaurantId);
    res.json({
      success: true,
      message: `🎉 Congratulations! "${result.restaurantName}" is now live and ready to receive orders!`,
      slug: result.slug,
      data: result.data
    });
  } catch (error) {
    if (error.missingItems) {
      return res.status(400).json({
        success: false,
        message: error.message,
        missingItems: error.missingItems
      });
    }
    next(error);
  }
};

export const getPublicRestaurantBySlug = async (req, res, next) => {
  try {
    const result = await getPublicRestaurantBySlugService(req.params.slug);
    if (!result.isAvailable) {
      return res.status(403).json({
        success: false,
        message: "This restaurant is currently setting up or inactive.",
        restaurant: result.restaurant
      });
    }
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};
