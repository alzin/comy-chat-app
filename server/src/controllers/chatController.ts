import Chat from '../models/Chat';
import { Request, Response } from 'express';

// Create a new chat
export const createChat = async (req: Request, res: Response) => {
  try {
    const { name, isGroupChat, users } = req.body;
    const userId = req.user.id;
    
    // Ensure current user is included in users array
    const userIds = [...new Set([...users, userId])];
    
    // For direct messages (non-group chats), check if chat already exists
    if (!isGroupChat && userIds.length === 2) {
      const existingChat = await Chat.findOne({
        isGroupChat: false,
        users: { $all: userIds, $size: 2 }
      });
      
      if (existingChat) {
        return res.status(200).json(existingChat);
      }
    }
    
    // Create new chat
    const newChat = new Chat({
      name: isGroupChat ? name : null,
      isGroupChat,
      users: userIds,
      admin: isGroupChat ? userId : null
    });
    
    await newChat.save();
    
    // Populate users info
    const fullChat = await Chat.findById(newChat._id)
      .populate('users', 'username avatar isOnline')
      .populate('admin', 'username avatar');
    
    res.status(201).json(fullChat);
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user chats
export const getUserChats = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    
    const chats = await Chat.find({ users: userId })
      .populate('users', 'username avatar isOnline')
      .populate('admin', 'username avatar')
      .populate({
        path: 'latestMessage',
        populate: {
          path: 'sender',
          select: 'username avatar'
        }
      })
      .sort({ updatedAt: -1 });
    
    res.status(200).json(chats);
  } catch (error) {
    console.error('Error fetching user chats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single chat
export const getChatById = async (req: Request, res: Response) => {
  try {
    const chatId = req.params.id;
    
    const chat = await Chat.findById(chatId)
      .populate('users', 'username avatar isOnline')
      .populate('admin', 'username avatar')
      .populate({
        path: 'latestMessage',
        populate: {
          path: 'sender',
          select: 'username avatar'
        }
      });
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    res.status(200).json(chat);
  } catch (error) {
    console.error('Error fetching chat:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add user to group
export const addToGroup = async (req: Request, res: Response) => {
  try {
    const { chatId, userId } = req.body;
    const adminId = req.user.id;
    
    // Check if chat exists and is group chat
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    if (!chat.isGroupChat) {
      return res.status(400).json({ message: 'This is not a group chat' });
    }
    
    // Check if requesting user is admin
    if (chat.admin.toString() !== adminId) {
      return res.status(403).json({ message: 'Only admin can add users' });
    }
    
    // Add user to group
    if (!chat.users.includes(userId)) {
      chat.users.push(userId);
      await chat.save();
    }
    
    // Return updated chat
    const updatedChat = await Chat.findById(chatId)
      .populate('users', 'username avatar isOnline')
      .populate('admin', 'username avatar');
    
    res.status(200).json(updatedChat);
  } catch (error) {
    console.error('Error adding user to group:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove user from group
export const removeFromGroup = async (req: Request, res: Response) => {
  try {
    const { chatId, userId } = req.body;
    const adminId = req.user.id;
    
    // Check if chat exists and is group chat
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    if (!chat.isGroupChat) {
      return res.status(400).json({ message: 'This is not a group chat' });
    }
    
    // Check if requesting user is admin
    if (chat.admin.toString() !== adminId) {
      return res.status(403).json({ message: 'Only admin can remove users' });
    }
    
    // Remove user from group
    chat.users = chat.users.filter(u => u.toString() !== userId);
    await chat.save();
    
    // Return updated chat
    const updatedChat = await Chat.findById(chatId)
      .populate('users', 'username avatar isOnline')
      .populate('admin', 'username avatar');
    
    res.status(200).json(updatedChat);
  } catch (error) {
    console.error('Error removing user from group:', error);
    res.status(500).json({ message: 'Server error' });
  }
};