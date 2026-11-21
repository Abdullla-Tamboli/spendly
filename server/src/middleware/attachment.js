import multer from 'multer';
import env from '../config/env.js';
import AppError from '../utils/AppError.js';

export const attachmentsEnabled = Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024, files: 1, fields: 0 }, fileFilter: (_req, file, callback) => {
  callback(['image/jpeg', 'image/png', 'application/pdf'].includes(file.mimetype) ? null : new AppError('Use a JPEG, PNG, or PDF file', 400, 'INVALID_ATTACHMENT'), true);
} }).single('attachment');
export function parseAttachment(req, res, next) {
  if (!attachmentsEnabled) return next(new AppError('Attachments require Cloudinary configuration', 501, 'ATTACHMENTS_UNAVAILABLE'));
  upload(req, res, (err) => {
    if (err) return next(err instanceof AppError ? err : new AppError(err.code === 'LIMIT_FILE_SIZE' ? 'Attachments must be 2 MB or smaller' : 'Upload one attachment only', 400, 'INVALID_ATTACHMENT'));
    if (!req.file) return next(new AppError('Choose an attachment', 400, 'INVALID_ATTACHMENT'));
    next();
  });
}
