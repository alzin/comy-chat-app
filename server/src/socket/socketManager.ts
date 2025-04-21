import { Server, Socket } from 'socket.io';
import { saveMessage } from '../controllers/messageController';
import { updateUserStatus } from '../controllers/userController';
import jwt from 'jsonwebtoken';

interface UserSocket {
  userId: string;
  socketId: string;
}

let onlineUsers: UserSocket[] = [];

export const setupSocketHandlers = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log('New client connected:', socket.id);

    // Authenticate user with token
    socket.on('authenticate', async (token) => {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret') as { id: string };
        const userId = decoded.id;
        
        // Add user to online users
        onlineUsers.push({ userId, socketId: socket.id });
        
        // Update user status in DB
        await updateUserStatus(userId, true);

        // Notify everyone about online status changes
        io.emit('userStatusChanged', { userId, isOnline: true });
        
        // Send current online users to the newly connected client
        socket.emit('onlineUsers', onlineUsers.map(u => u.userId));
        
        console.log(`User ${userId} authenticated`);
      } catch (error) {
        console.error('Authentication error:', error);
        socket.disconnect();
      }
    });

    // Handle new message
    socket.on('sendMessage', async (data) => {
      try {
        const { chatId, content, senderId } = data;
        
        // Save message to database
        const newMessage = await saveMessage({
          chat: chatId,
          sender: senderId,
          content
        });
        
        // Broadcast message to everyone in the chat
        io.emit('newMessage', newMessage);
        
        // Send typing stopped event
        io.emit('userStoppedTyping', senderId);
      } catch (error) {
        console.error('Error sending message:', error);
      }
    });

    // Handle user typing event
    socket.on('typing', (data) => {
      const { chatId, userId } = data;
      socket.broadcast.emit('userTyping', { chatId, userId });
    });

    // Handle user stopped typing event
    socket.on('stopTyping', (data) => {
      const { chatId, userId } = data;
      socket.broadcast.emit('userStoppedTyping', { chatId, userId });
    });

    // Handle read receipts
    socket.on('messageRead', async (data) => {
      const { messageId, userId } = data;
      io.emit('messageReadUpdate', { messageId, userId });
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log('Client disconnected:', socket.id);
      
      // Find the disconnected user
      const userIndex = onlineUsers.findIndex(user => user.socketId === socket.id);
      
      if (userIndex !== -1) {
        const userId = onlineUsers[userIndex].userId;
        
        // Remove user from online users
        onlineUsers.splice(userIndex, 1);
        
        // Update user status in DB
        await updateUserStatus(userId, false);
        
        // Notify everyone about online status changes
        io.emit('userStatusChanged', { userId, isOnline: false });
      }
    });
  });
};