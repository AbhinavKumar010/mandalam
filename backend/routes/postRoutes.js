import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { uploadImage } from '../middleware/imageUpload.js';
import {
  createPost,
  getFeedPosts,
  toggleLikePost,
  addComment,
} from '../controllers/postController.js';

const router = express.Router();

router.route('/')
  .get(protect, getFeedPosts)
  .post(protect, uploadImage('image'), createPost);

router.put('/:id/like', protect, toggleLikePost);
router.post('/:id/comment', protect, addComment);

export default router;