import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { badRequest } from '../utils/http-error';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_FILES_PER_REQUEST = 4;

// Memory storage: files are streamed straight to Supabase Storage in the service layer,
// never written to disk on our (ephemeral, free-tier) server.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: MAX_FILES_PER_REQUEST },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      callback(badRequest('Solo se aceptan fotos en formato JPG, PNG o WEBP'));
      return;
    }
    callback(null, true);
  }
}).array('fotos', MAX_FILES_PER_REQUEST);

export function uploadFotos(req: Request, res: Response, next: NextFunction): void {
  upload(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        next(badRequest('Cada foto debe pesar como máximo 5MB'));
        return;
      }
      if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
        next(badRequest(`Puedes adjuntar como máximo ${MAX_FILES_PER_REQUEST} fotos por vez`));
        return;
      }
      next(badRequest(err.message));
      return;
    }
    next(err);
  });
}
