import express from 'express';
import { 
  createChat,
  getUserChats,
  getChatById,
  addToGroup,
  removeFromGroup
} from '../controllers/chatController';
import { getMessages, markAsRead } from '../controllers/messageController';
import { auth } from '../middleware/authMiddleware';

const router = express.Router();

// Protect all routes
router.use(auth);

// Chat routes
router.post('/', createChat);
router.get('/', getUserChats);
router.get('/:id', getChatById);
router.put('/group/add', addToGroup);
router.put('/group/remove', removeFromGroup);

// Messages routes
router.get('/:chatId/messages', getMessages);
router.put('/messages/:messageId/read', markAsRead);

export default router;