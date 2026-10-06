import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getRoomMessages,
  getChatUsers,
  saveMessage,
} from '../controllers/chatController.js';

const router = express.Router();

router.get('/users', protect, getChatUsers);
router.get('/:roomId', protect, getRoomMessages);
router.post('/send', protect, saveMessage);

export default router;