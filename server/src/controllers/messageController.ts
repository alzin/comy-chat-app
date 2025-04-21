import Message from '../models/Message';
import Chat from '../models/Chat';
import { Request, Response } from 'express';
import mongoose from 'mongoose';

interface MessageInput {
  chat: string; // chat ID
  sender: string; // user ID
  content: string;
}

// Save message to database
export const saveMessage = async (messageData: MessageInput) => {
  try {
    const newMessage = new Message(messageData);
    await newMessage.save();
    
    // Update chat's latest message
    await Chat.findByIdAndUpdate(messageData.chat, { 
      latestMessage: newMessage._id 
    });
    
    // Populate sender info before returning
    const message = await Message.findById(newMessage._id)
      .populate('sender', 'username avatar')
      .populate('readBy', 'username');
    
    return message;
  } catch (error) {
    console.error('Error saving message:', error);
    throw error;
  }
};

// Get messages for a chat
export const getMessages = async (req: Request, res: Response) => {
  try {
    const chatId = req.params.chatId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;
    
    const messages = await Message.find({ chat: chatId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'username avatar')
      .populate('readBy', 'username');
    
    res.status(200).json({
      messages: messages.reverse(),
      page,
      limit
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark message as read
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;
    
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    // 👇 Convert string to ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // 👇 Use ObjectId-safe comparison
    if (!message.readBy.includes(userObjectId)) {
      message.readBy.push(userObjectId);
    }
    
    res.status(200).json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
};