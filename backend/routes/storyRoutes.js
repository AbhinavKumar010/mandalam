import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { uploadImage } from '../middleware/imageUpload.js';
import { createStory, getActiveStories } from '../controllers/storyController.js';

const router = express.Router();

router.route('/').get(protect, getActiveStories).post(protect, uploadImage('image'), createStory);

export default router;