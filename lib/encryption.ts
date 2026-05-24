/**
 * Encryption utilities for sensitive data (passport information)
 * Uses AES-256-GCM encryption
 */

import crypto from 'crypto';

// Encryption key from environment (must be 32 bytes for AES-256)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32bytes';

// Ensure key is exactly 32 bytes
function getEncryptionKey(): Buffer {
  const key = ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32);
  return Buffer.from(key, 'utf-8');
}

/**
 * Encrypt sensitive data
 * @param text - Plain text to encrypt
 * @returns Encrypted string in format: iv:authTag:encryptedData
 */
export function encrypt(text: string): string {
  if (!text) return '';

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(16); // Initialization vector
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Return format: iv:authTag:encryptedData
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('[Encryption] Error encrypting data:', error);
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypt sensitive data
 * @param encryptedText - Encrypted string in format: iv:authTag:encryptedData
 * @returns Decrypted plain text
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return '';

  try {
    const key = getEncryptionKey();
    const parts = encryptedText.split(':');

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const [ivHex, authTagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('[Encryption] Error decrypting data:', error);
    throw new Error('Decryption failed');
  }
}

/**
 * Hash sensitive data (one-way, for comparison only)
 * @param text - Plain text to hash
 * @returns SHA-256 hash
 */
export function hash(text: string): string {
  if (!text) return '';
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Mask sensitive data for display (e.g., passport number)
 * @param text - Text to mask
 * @param visibleChars - Number of characters to show at start and end
 * @returns Masked string
 */
export function maskSensitiveData(text: string, visibleChars: number = 2): string {
  if (!text || text.length <= visibleChars * 2) return text;

  const start = text.slice(0, visibleChars);
  const end = text.slice(-visibleChars);
  const masked = '*'.repeat(text.length - visibleChars * 2);

  return `${start}${masked}${end}`;
}

/**
 * Encrypt passport data object
 */
export interface PassportData {
  passportSeries?: string;
  passportNumber?: string;
  issuedBy?: string;
  departmentCode?: string;
}

export function encryptPassportData(data: PassportData): PassportData {
  return {
    passportSeries: data.passportSeries ? encrypt(data.passportSeries) : undefined,
    passportNumber: data.passportNumber ? encrypt(data.passportNumber) : undefined,
    issuedBy: data.issuedBy ? encrypt(data.issuedBy) : undefined,
    departmentCode: data.departmentCode ? encrypt(data.departmentCode) : undefined,
  };
}

/**
 * Decrypt passport data object
 */
export function decryptPassportData(data: PassportData): PassportData {
  return {
    passportSeries: data.passportSeries ? decrypt(data.passportSeries) : undefined,
    passportNumber: data.passportNumber ? decrypt(data.passportNumber) : undefined,
    issuedBy: data.issuedBy ? decrypt(data.issuedBy) : undefined,
    departmentCode: data.departmentCode ? decrypt(data.departmentCode) : undefined,
  };
}

/**
 * Check if encryption key is properly configured
 */
export function isEncryptionConfigured(): boolean {
  return ENCRYPTION_KEY !== 'default-key-change-in-production-32bytes';
}

