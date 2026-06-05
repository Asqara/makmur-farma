export const UPLOAD_IMAGE_TYPES = {
  banner: "banner",
  logo: "logo",
  product: "product",
} as const;

export type UploadImageType = (typeof UPLOAD_IMAGE_TYPES)[keyof typeof UPLOAD_IMAGE_TYPES];

export const UPLOAD_FILE_LIMIT_BYTES = {
  banner: 2 * 1024 * 1024,
  logo: 1 * 1024 * 1024,
  product: 2 * 1024 * 1024,
} as const;

export const UPLOAD_IMAGE_RATIO = {
  banner: [16 / 9, 4 / 3],
  logo: [1],
  product: [1],
} as const;

export const UPLOAD_RATIO_TOLERANCE = 0.03;

/**
 * MIME types allowed for product gallery uploads.
 */
export const PRODUCT_IMAGE_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

/**
 * File extensions allowed for product gallery uploads.
 */
export const PRODUCT_IMAGE_ALLOWED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
] as const;

/**
 * Cloudflare R2 environment keys for product image storage.
 */
export const CLOUDFLARE_R2_ENV_KEYS = {
  accessKeyId: "CLOUDFLARE_R2_ACCESS_KEY_ID",
  accountId: "CLOUDFLARE_R2_ACCOUNT_ID",
  bucket: "CLOUDFLARE_R2_BUCKET",
  endpoint: "CLOUDFLARE_R2_ENDPOINT",
  publicUrl: "CLOUDFLARE_R2_PUBLIC_URL",
  secretAccessKey: "CLOUDFLARE_R2_SECRET_ACCESS_KEY",
} as const;

/**
 * R2 region used by the S3-compatible API.
 */
export const CLOUDFLARE_R2_REGION = "auto";
