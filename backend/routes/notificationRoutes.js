import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getNotifications, markNotificationsRead } from '../controllers/notificationController.js';

const router = express.Router();

router.get('/', protect, getNotifications);
router.patch('/read', protect, markNotificationsRead);

export default router;