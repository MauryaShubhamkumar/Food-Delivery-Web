import dotenv from 'dotenv';
dotenv.config();

export const validateEnv = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const requiredKeys = ['PORT', 'JWT_SECRET'];

  const missingKeys = [];

  for (const key of requiredKeys) {
    if (!process.env[key] || process.env[key].trim() === '') {
      missingKeys.push(key);
    }
  }

  if (isProduction && process.env.JWT_SECRET === 'super_secret_food_del_jwt_key_2026') {
    console.error("❌ CRITICAL SECURITY RISK: Default JWT_SECRET fallback detected in production environment.");
    console.error("Please set a strong, unique JWT_SECRET in your production environment variables.");
    process.exit(1);
  }

  if (missingKeys.length > 0) {
    console.warn(`⚠️ Warning: Missing recommended environment variables: ${missingKeys.join(', ')}`);
    if (isProduction) {
      console.error("❌ Fatal Configuration Error: Cannot start server in production without required environment variables.");
      process.exit(1);
    }
  } else {
    console.log("✅ Environment configuration validated successfully.");
  }
};
