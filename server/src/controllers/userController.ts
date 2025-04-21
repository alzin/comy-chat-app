import User from '../models/User';
import { Request, Response } from 'express';

// Get user profile
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user status
export const updateUserStatus = async (userId: string, isOnline: boolean) => {
  try {
    await User.findByIdAndUpdate(userId, { 
      isOnline,
      lastActive: new Date()
    });
    return true;
  } catch (error) {
    console.error('Error updating user status:', error);
    return false;
  }
};

// Search users
export const searchUsers = async (req: Request, res: Response) => {
  try {
    const searchTerm = req.query.search as string;
    
    if (!searchTerm) {
      return res.status(400).json({ message: 'Search term is required' });
    }
    
    const users = await User.find({
      $or: [
        { username: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } }
      ]
    }).select('-password');
    
    res.status(200).json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user profile
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { username, avatar } = req.body;
    const userId = req.user.id;
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { username, avatar },
      { new: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};