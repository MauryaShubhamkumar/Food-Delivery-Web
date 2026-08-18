import { getPool } from '../../config/db.js';

export const getPlatformSettingsRepo = async () => {
  const pool = getPool();
  const [rows] = await pool.query('SELECT * FROM platform_settings WHERE id = 1');
  return rows[0] || null;
};

export const updatePlatformSettingsRepo = async ({ platformName, tagline, logoUrl, supportEmail, supportPhone, supportAddress, description }) => {
  const pool = getPool();
  await pool.query(
    `INSERT INTO platform_settings (id, platform_name, tagline, logo_url, support_email, support_phone, support_address, description)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       platform_name = VALUES(platform_name),
       tagline = VALUES(tagline),
       logo_url = VALUES(logo_url),
       support_email = VALUES(support_email),
       support_phone = VALUES(support_phone),
       support_address = VALUES(support_address),
       description = VALUES(description)`,
    [platformName, tagline, logoUrl, supportEmail, supportPhone, supportAddress, description]
  );
  return await getPlatformSettingsRepo();
};
