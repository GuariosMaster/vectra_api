import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';
import fs from 'fs';
import path from 'path';

const isConfigured = !!(
  env.CLOUDINARY_CLOUD_NAME &&
  env.CLOUDINARY_API_KEY &&
  env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME!,
    api_key: env.CLOUDINARY_API_KEY!,
    api_secret: env.CLOUDINARY_API_SECRET!,
  });
}

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

export async function uploadImage(
  buffer: Buffer,
  _folder: string,
  publicId?: string
): Promise<{ url: string; publicId: string }> {
  // ── Local fallback when Cloudinary is not configured ───────────────────────
  if (!isConfigured) {
    if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    const filename = `${publicId ?? Date.now()}.jpg`;
    const filepath = path.join(UPLOADS_DIR, filename);
    fs.writeFileSync(filepath, buffer);
    const url = `${env.API_URL}/uploads/${filename}`;
    return { url, publicId: filename };
  }

  // ── Cloudinary upload ──────────────────────────────────────────────────────
  return new Promise((resolve, reject) => {
    const options: Record<string, unknown> = {
      folder: _folder,
      resource_type: 'image',
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    };
    if (publicId) options.public_id = publicId;

    cloudinary.uploader
      .upload_stream(options, (error, result) => {
        if (error || !result) return reject(error ?? new Error('Upload failed'));
        resolve({ url: result.secure_url, publicId: result.public_id });
      })
      .end(buffer);
  });
}

export async function deleteImage(publicId: string): Promise<void> {
  if (!isConfigured) {
    const filepath = path.join(UPLOADS_DIR, publicId);
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    return;
  }
  await cloudinary.uploader.destroy(publicId);
}
