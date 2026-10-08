import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { uploadMedia } from '../middleware/imageUpload.js';
import { createStory, getActiveStories } from '../controllers/storyController.js';

const router = express.Router();

router.route('/').get(protect, getActiveStories).post(protect, uploadMedia('image'), createStory);

export default router;