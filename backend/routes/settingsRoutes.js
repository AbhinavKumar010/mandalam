import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getPeople, getSettings, updateSettings } from '../controllers/settingsController.js';

const router = express.Router();

router.get('/', protect, getSettings);
router.get('/people', protect, getPeople);
router.patch('/', protect, updateSettings);

export default router;