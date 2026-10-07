import { upload } from '../config/cloudinary.js';

export const uploadMedia = (fieldName) => (req, res, next) => {
  upload.single(fieldName)(req, res, (error) => {
    if (!error) return next();

    console.error('Image upload failed:', error);
    const statusCode = error.code === 'LIMIT_FILE_SIZE'
      ? 413
      : error.name === 'MulterError' || error.name === 'Error' ? 400 : 500;
    return res.status(statusCode).json({ message: error.message || 'Media upload failed' });
  });
};