import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { connectDB, getPool } from '../config/db.js';
import { uploadFilePathToCloudinary } from '../config/cloudinary.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');

const runMigration = async () => {
  console.log("==================================================");
  console.log("🚀 Starting FastBite Image Migration to Cloudinary");
  console.log("==================================================\n");

  let pool;
  try {
    await connectDB();
    pool = getPool();
    console.log(`Connected to MySQL database via connection pool successfully.\n`);
  } catch (err) {
    console.error("❌ Failed to connect to MySQL database:", err.message);
    process.exit(1);
  }

  let totalMigrated = 0;
  let totalFailed = 0;
  let totalSkipped = 0;

  // 1. Migrate Food Items
  console.log("📦 Checking Food Items...");
  try {
    const [foodRows] = await pool.query("SELECT id, name, image, cloudinary_public_id FROM food_items");
    
    for (const item of foodRows) {
      // Idempotency check: Skip if already migrated to Cloudinary
      if (item.cloudinary_public_id || (item.image && item.image.includes('res.cloudinary.com'))) {
        console.log(`   ⏭️  [SKIPPED] Food #${item.id} "${item.name}" (already on Cloudinary)`);
        totalSkipped++;
        continue;
      }

      // If image is a remote URL (e.g. Unsplash), upload remote URL directly to Cloudinary
      if (item.image && item.image.startsWith('http')) {
        try {
          console.log(`   ⬆️  [UPLOADING] External URL for Food #${item.id} "${item.name}" -> Cloudinary...`);
          const uploadRes = await uploadFilePathToCloudinary(item.image, 'FastBite/products', `food_${item.id}`);
          await pool.query(
            'UPDATE food_items SET image = ?, cloudinary_public_id = ? WHERE id = ?',
            [uploadRes.secure_url, uploadRes.public_id, item.id]
          );
          console.log(`   ✅  [SUCCESS] Food #${item.id} "${item.name}" -> ${uploadRes.secure_url}`);
          totalMigrated++;
        } catch (upErr) {
          console.error(`   ❌  [FAILED] Food #${item.id} "${item.name}":`, upErr.message);
          totalFailed++;
        }
        continue;
      }

      // Local file in backend/uploads/
      let localPath = null;
      let filename = item.image;

      if (filename) {
        const cleanFilename = path.basename(filename);
        localPath = path.join(uploadsDir, cleanFilename);
      }

      if (!localPath || !fs.existsSync(localPath)) {
        console.log(`   ⚠️  [SKIPPED] Food #${item.id} "${item.name}" (Local file not found: ${filename})`);
        totalSkipped++;
        continue;
      }

      try {
        const cleanFilename = path.basename(filename);
        console.log(`   ⬆️  [UPLOADING] Local file "${cleanFilename}" for Food #${item.id} "${item.name}" -> Cloudinary...`);
        const uploadRes = await uploadFilePathToCloudinary(localPath, 'FastBite/products', `food_${item.id}`);
        
        await pool.query(
          'UPDATE food_items SET image = ?, cloudinary_public_id = ? WHERE id = ?',
          [uploadRes.secure_url, uploadRes.public_id, item.id]
        );
        console.log(`   ✅  [SUCCESS] Food #${item.id} "${item.name}" -> ${uploadRes.secure_url}`);
        totalMigrated++;
      } catch (upErr) {
        console.error(`   ❌  [FAILED] Food #${item.id} "${item.name}":`, upErr.message);
        totalFailed++;
      }
    }
  } catch (foodErr) {
    console.error("Error querying food_items table:", foodErr.message);
  }

  // 2. Migrate Restaurant Settings Logo
  console.log("\n🏪 Checking Restaurant Settings Logo...");
  try {
    const [settingsRows] = await pool.query("SELECT id, restaurant_name, logo_url, logo_public_id FROM restaurant_settings LIMIT 1");
    if (settingsRows.length > 0) {
      const s = settingsRows[0];
      if (s.logo_public_id || (s.logo_url && s.logo_url.includes('res.cloudinary.com'))) {
        console.log(`   ⏭️  [SKIPPED] Restaurant Logo (already on Cloudinary)`);
        totalSkipped++;
      } else if (s.logo_url) {
        let localLogoPath = null;
        if (s.logo_url.startsWith('http')) {
          localLogoPath = s.logo_url;
        } else {
          const cleanLogoName = path.basename(s.logo_url);
          localLogoPath = path.join(uploadsDir, cleanLogoName);
        }

        if (typeof localLogoPath === 'string' && (localLogoPath.startsWith('http') || fs.existsSync(localLogoPath))) {
          try {
            console.log(`   ⬆️  [UPLOADING] Restaurant Logo -> Cloudinary...`);
            const uploadRes = await uploadFilePathToCloudinary(localLogoPath, 'FastBite/restaurant', 'logo');
            await pool.query(
              'UPDATE restaurant_settings SET logo_url = ?, logo_public_id = ? WHERE id = ?',
              [uploadRes.secure_url, uploadRes.public_id, s.id]
            );
            console.log(`   ✅  [SUCCESS] Restaurant Logo -> ${uploadRes.secure_url}`);
            totalMigrated++;
          } catch (upErr) {
            console.error(`   ❌  [FAILED] Restaurant Logo:`, upErr.message);
            totalFailed++;
          }
        } else {
          console.log(`   ⚠️  [SKIPPED] Restaurant Logo (Local file not found: ${s.logo_url})`);
          totalSkipped++;
        }
      } else {
        console.log(`   ⏭️  [SKIPPED] Restaurant Logo (No logo set)`);
        totalSkipped++;
      }
    }
  } catch (settErr) {
    console.error("Error querying restaurant_settings table:", settErr.message);
  }

  // 3. Migrate Categories Images (if any)
  console.log("\n📁 Checking Categories...");
  try {
    const [catRows] = await pool.query("SELECT id, name, image, cloudinary_public_id FROM categories WHERE image IS NOT NULL AND image != ''");
    for (const cat of catRows) {
      if (cat.cloudinary_public_id || (cat.image && cat.image.includes('res.cloudinary.com'))) {
        console.log(`   ⏭️  [SKIPPED] Category #${cat.id} "${cat.name}" (already on Cloudinary)`);
        totalSkipped++;
        continue;
      }
      let localCatPath = cat.image.startsWith('http') ? cat.image : path.join(uploadsDir, path.basename(cat.image));
      if (cat.image.startsWith('http') || fs.existsSync(localCatPath)) {
        try {
          console.log(`   ⬆️  [UPLOADING] Category #${cat.id} "${cat.name}" -> Cloudinary...`);
          const uploadRes = await uploadFilePathToCloudinary(localCatPath, 'FastBite/categories', `category_${cat.id}`);
          await pool.query(
            'UPDATE categories SET image = ?, cloudinary_public_id = ? WHERE id = ?',
            [uploadRes.secure_url, uploadRes.public_id, cat.id]
          );
          console.log(`   ✅  [SUCCESS] Category #${cat.id} "${cat.name}" -> ${uploadRes.secure_url}`);
          totalMigrated++;
        } catch (upErr) {
          console.error(`   ❌  [FAILED] Category #${cat.id} "${cat.name}":`, upErr.message);
          totalFailed++;
        }
      } else {
        console.log(`   ⚠️  [SKIPPED] Category #${cat.id} "${cat.name}" (Local file not found)`);
        totalSkipped++;
      }
    }
  } catch (catErr) {
    // Categories table image column query failed or empty
  }

  console.log("\n--------------------------------------------------");
  console.log("🎉 Migration Summary Report");
  console.log("--------------------------------------------------");
  console.log(`  Successful Uploads : ${totalMigrated}`);
  console.log(`  Failed Uploads     : ${totalFailed}`);
  console.log(`  Skipped Items      : ${totalSkipped}`);
  console.log("--------------------------------------------------\n");

  process.exit(0);
};

runMigration();
