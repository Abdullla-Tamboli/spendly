import { createHash } from 'node:crypto';
import env from '../config/env.js';
import AppError from '../utils/AppError.js';
import Transaction from '../models/Transaction.js';

export async function attachFile(userId, id, file) {
  const tx = await Transaction.findOne({ _id: id, user: userId });
  if (!tx) throw new AppError('Transaction not found', 404, 'NOT_FOUND');
  const signatures = { 'image/png': '89504e470d0a1a0a', 'image/jpeg': 'ffd8ff', 'application/pdf': '25504446' };
  if (!file.buffer.toString('hex').startsWith(signatures[file.mimetype])) throw new AppError('File content does not match its type', 400, 'INVALID_ATTACHMENT');
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHash('sha1').update(`timestamp=${timestamp}${env.CLOUDINARY_API_SECRET}`).digest('hex');
  const form = new FormData();
  form.append('file', new Blob([file.buffer], { type: file.mimetype }), file.originalname);
  form.append('api_key', env.CLOUDINARY_API_KEY);
  form.append('timestamp', String(timestamp));
  form.append('signature', signature);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(env.CLOUDINARY_CLOUD_NAME)}/auto/upload`, { method: 'POST', body: form, signal: AbortSignal.timeout(30000) });
  const uploaded = await response.json();
  if (!response.ok) throw new AppError('Attachment upload failed. Please try again.', 502, 'UPLOAD_FAILED');
  tx.attachment = { url: uploaded.secure_url, publicId: uploaded.public_id, mimeType: file.mimetype };
  await tx.save();
  return tx;
}
