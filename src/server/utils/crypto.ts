import crypto from 'crypto';
import dotenv from 'dotenv';
import logger from './logger';

dotenv.config();

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

// Fallback for development only
const getEncryptionKey = (): Buffer => {
  const rawKey = process.env.ENCRYPTION_KEY?.trim();
  
  if (rawKey) {
    const keyBuffer = Buffer.from(rawKey, 'hex');
    if (keyBuffer.length === 32) {
      return keyBuffer;
    }
    
    const errorMsg = `Invalid ENCRYPTION_KEY length: expected 32 bytes (64 hex characters), got ${keyBuffer.length} bytes.`;
    if (process.env.NODE_ENV === 'production') {
      logger.error(`CRITICAL: ${errorMsg}`);
      throw new Error(errorMsg);
    } else {
      logger.warn(`${errorMsg} Falling back to development key.`);
    }
  } else if (process.env.NODE_ENV === 'production') {
    const errorMsg = `CRITICAL: ENCRYPTION_KEY is missing in production environment.`;
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }
  
  return Buffer.from('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', 'hex');
};

const ENCRYPTION_KEY = getEncryptionKey();

/**
 * Encrypts plain text using AES-256-GCM.
 * Format: iv:tag:encryptedContent
 */
export const encrypt = (text: string): string => {
  if (!text) return text;
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
  } catch (error: any) {
    logger.error('Encryption failed', { error: error.message });
    throw new Error('Internal security error during data processing');
  }
};

/**
 * Decrypts text encrypted with AES-256-GCM.
 */
export const decrypt = (text: string): string => {
  if (!text) return text;
  try {
    const parts = text.split(':');
    if (parts.length !== 3) return text; // Probably not encrypted

    const [ivHex, tagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error: any) {
    // If decryption fails, log it but return the original text (might be legacy plain text)
    logger.warn('Decryption failed, returning original text', { error: error.message });
    return text;
  }
};

/**
 * Generates a deterministic "Blind Index" for searching encrypted fields.
 * Uses HMAC-SHA256 with the same encryption key.
 */
export const generateBlindIndex = (text: string): string => {
  if (!text) return text;
  return crypto
    .createHmac('sha256', ENCRYPTION_KEY)
    .update(text.toLowerCase().trim())
    .digest('hex');
};
