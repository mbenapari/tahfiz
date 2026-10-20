'use strict';

require('dotenv').config();
const crypto = require('crypto');
const bcrypt = require('bcrypt');

// Mirrors src/server/utils/crypto.ts so values match what the app reads/writes.
const getKey = () => {
  const raw = process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.trim();
  if (raw) {
    const buf = Buffer.from(raw, 'hex');
    if (buf.length === 32) return buf;
    if (process.env.NODE_ENV === 'production') throw new Error('Invalid ENCRYPTION_KEY length');
  } else if (process.env.NODE_ENV === 'production') {
    throw new Error('ENCRYPTION_KEY is missing in production');
  }
  return Buffer.from('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', 'hex');
};

const encrypt = (text, key) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let enc = cipher.update(text, 'utf8', 'hex');
  enc += cipher.final('hex');
  return `${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${enc}`;
};

const decrypt = (text, key) => {
  if (!text) return text;
  const parts = text.split(':');
  if (parts.length !== 3) return text;
  try {
    const d = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(parts[0], 'hex'));
    d.setAuthTag(Buffer.from(parts[1], 'hex'));
    return d.update(parts[2], 'hex', 'utf8') + d.final('utf8');
  } catch {
    return text;
  }
};

const blindIndex = (text, key) =>
  crypto.createHmac('sha256', key).update(text.toLowerCase().trim()).digest('hex');

/**
 * Usage:
 *   OWNER_NEW_EMAIL=you@domain.com OWNER_NEW_PASSWORD='...' \
 *   [OWNER_OLD_EMAIL=owner@example.com] npm run db:migrate
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const newEmail = (process.env.OWNER_NEW_EMAIL || '').toLowerCase().trim();
    const newPassword = process.env.OWNER_NEW_PASSWORD;
    const oldEmail = (process.env.OWNER_OLD_EMAIL || 'owner@example.com').toLowerCase().trim();

    if (!newEmail || !newPassword) {
      throw new Error('OWNER_NEW_EMAIL and OWNER_NEW_PASSWORD must be set to run this migration');
    }

    const key = getKey();
    const owners = await queryInterface.sequelize.query(
      'SELECT id, email FROM system_owners ORDER BY id',
      { type: Sequelize.QueryTypes.SELECT }
    );

    const target = owners.find(o => (decrypt(o.email, key) || '').toLowerCase().trim() === oldEmail);
    if (!target) {
      throw new Error(`No system owner found with email "${oldEmail}" (set OWNER_OLD_EMAIL)`);
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await queryInterface.sequelize.query(
      `UPDATE system_owners
          SET email = :email,
              email_blind_index = :blind,
              password = :password,
              updated_at = NOW()
        WHERE id = :id`,
      {
        replacements: {
          email: encrypt(newEmail, key),
          blind: blindIndex(newEmail, key),
          password: passwordHash,
          id: target.id
        }
      }
    );
  },

  async down() {
    // Credentials reset cannot be reverted (old password hash is not retained).
  }
};
