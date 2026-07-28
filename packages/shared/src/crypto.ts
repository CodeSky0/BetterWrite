import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { logger } from './logger.js';

// AES-256-GCM 对称加密，用于 API Key 等敏感配置的落库加密。
// 注意：本模块依赖 node:crypto，只能在服务端（web API / worker）使用，
// 不能从 @betterwrite/shared 主入口导出，请从子路径 '@betterwrite/shared/crypto' 导入。
const ALGO = 'aes-256-gcm';
const IV_LEN = 12;
const AUTH_TAG_LEN = 16;

let devKey: Buffer | null = null;

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw || raw.length !== 64) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        '[Crypto] ENCRYPTION_KEY 未设置或长度不正确（需要 64 hex 字符 = 256-bit），生产环境必须设置。',
      );
    }
    if (!devKey) {
      logger.warn(
        '[Crypto] ENCRYPTION_KEY 未设置或长度非 64 hex 字符（256-bit），使用随机开发兜底密钥。生产环境必须设置。',
      );
      devKey = randomBytes(32);
    }
    return devKey;
  }
  return Buffer.from(raw, 'hex');
}

export function encrypt(plain: string): string {
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, getKey(), iv);
  let enc: Buffer;
  try {
    enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  } catch (err) {
    cipher.destroy();
    throw err;
  }
  const authTag = cipher.getAuthTag();
  cipher.destroy();
  return Buffer.concat([iv, authTag, enc]).toString('base64');
}

export function decrypt(payload: string): string {
  const buf = Buffer.from(payload, 'base64');
  const iv = buf.subarray(0, IV_LEN);
  const authTag = buf.subarray(IV_LEN, IV_LEN + AUTH_TAG_LEN);
  const enc = buf.subarray(IV_LEN + AUTH_TAG_LEN);
  const decipher = createDecipheriv(ALGO, getKey(), iv);
  decipher.setAuthTag(authTag);
  let dec: Buffer;
  try {
    dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  } catch (err) {
    decipher.destroy();
    throw err;
  }
  decipher.destroy();
  return dec.toString('utf8');
}

export function maskKey(key: string): string {
  if (key.length <= 4) return '****';
  return `****${key.slice(-4)}`;
}
