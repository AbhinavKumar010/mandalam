import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import path from 'path';
import { mkdirSync } from 'fs';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const hasCloudinaryConfig = [
  process.env.CLOUDINARY_CLOUD_NAME,
  process.env.CLOUDINARY_API_KEY,
  process.env.CLOUDINARY_API_SECRET,
].every(Boolean);

if (process.env.NODE_ENV === 'production' && !hasCloudinaryConfig) {
  throw new Error('Cloudinary credentials are required for production media uploads.');
}

let storage;
if (process.env.NODE_ENV === 'production') {
  storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'chalchitra',
      resource_type: 'auto',
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'mp4', 'webm'],
    },
  });
} else {
  const uploadDirectory = path.resolve('uploads');
  mkdirSync(uploadDirectory, { recursive: true });
  storage = multer.diskStorage({
    destination: uploadDirectory,
    filename: (req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase();
      callback(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
    },
  });
}

export const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];
    if (!allowedTypes.includes(file.mimetype)) {
      return callback(new Error('Choose a JPG, PNG, WebP, MP4, or WebM file.'));
    }
    callback(null, true);
  },
});