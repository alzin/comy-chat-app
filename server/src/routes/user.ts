import express from 'express';
import { getUserProfile, searchUsers, updateProfile } from '../controllers/userController';
import { auth } from '../middleware/authMiddleware';

const router = express.Router();

// Protect routes
router.use(auth);

// User routes
router.get('/search', searchUsers);
router.get('/:id', getUserProfile);
router.put('/profile', updateProfile);

export default router;