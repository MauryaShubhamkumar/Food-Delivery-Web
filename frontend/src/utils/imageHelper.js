import {
  assets,
  food_list as defaultFoodList,
  menu_list as defaultMenuList
} from '../assets/assets';

// Dynamically extract imported food and menu assets
const foodAssetsMap = {};
defaultFoodList.forEach((item) => {
  const index = item._id;
  foodAssetsMap[`food_${index}.png`] = item.image;
  foodAssetsMap[`food_${index}`] = item.image;
});

const menuAssetsMap = {};
defaultMenuList.forEach((item) => {
  menuAssetsMap[item.menu_name.toLowerCase()] = item.menu_image;
});

// Fallback images for popular categories
const categoryFallbackImages = {
  'salad': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=300&q=80',
  'pizza': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=300&q=80',
  'burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80',
  'biryani': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=300&q=80',
  'rolls': 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=300&q=80',
  'deserts': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=300&q=80',
  'dessert': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=300&q=80',
  'sandwich': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=300&q=80',
  'cake': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=300&q=80',
  'pasta': 'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?auto=format&fit=crop&w=300&q=80',
  'noodles': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=300&q=80',
  'pure veg': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80',
  'beverages': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=300&q=80',
  'drinks': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=300&q=80'
};

export const resolveFoodImage = (imageSrc, foodName = '') => {
  if (!imageSrc || imageSrc.trim() === '') {
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
  }

  const clean = imageSrc.trim();

  // Full URL
  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:')) {
    return clean;
  }

  // Local assets map match (e.g. 'food_10.png' -> imported asset)
  if (foodAssetsMap[clean]) {
    return foodAssetsMap[clean];
  }

  const baseName = clean.split('/').pop().split('?')[0];
  if (foodAssetsMap[baseName]) {
    return foodAssetsMap[baseName];
  }

  // Match by food name in defaultFoodList
  if (foodName) {
    const matchByName = defaultFoodList.find(
      (f) => f.name.toLowerCase() === foodName.toLowerCase()
    );
    if (matchByName) return matchByName.image;
  }

  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
};

export const resolveCategoryImage = (catName = '', imageSrc = '') => {
  if (imageSrc && (imageSrc.startsWith('http://') || imageSrc.startsWith('https://'))) {
    return imageSrc;
  }

  const key = (catName || '').trim().toLowerCase();
  if (menuAssetsMap[key]) {
    return menuAssetsMap[key];
  }

  if (categoryFallbackImages[key]) {
    return categoryFallbackImages[key];
  }

  return assets.menu_1;
};
