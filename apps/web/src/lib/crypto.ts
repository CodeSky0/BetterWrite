// 加密实现已迁移至 @betterwrite/shared/crypto（worker 解密 API Key 也依赖同一实现）。
// 此处保留 re-export 以兼容既有 '@/lib/crypto' 导入路径。
export { decrypt, encrypt, maskKey } from '@betterwrite/shared/crypto';
