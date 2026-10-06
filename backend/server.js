import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from './config/db.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import postRoutes from './routes/postRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import storyRoutes from './routes/storyRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';

// Model Imports for Socket handlers
import Message from './models/Message.js';

// Environment variables configuration
dotenv.config();

// Connect Database
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io with permissive CORS for client development
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.resolve('uploads')));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);

// Socket.io Real-time Event Management
io.on('connection', (socket) => {
  console.log(`Socket Client Connected: ${socket.id}`);

  // 1. Join a specific conversation room
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
  });

  // 2. Typing Indicators
  socket.on('typing', ({ roomId, userId, username }) => {
    socket.to(roomId).emit('user_typing', { userId, username });
  });

  socket.on('stop_typing', ({ roomId, userId }) => {
    socket.to(roomId).emit('user_stop_typing', { userId });
  });

  // 3. Mark Messages as Read
  socket.on('mark_as_read', async ({ roomId, userId }) => {
    try {
      if (!roomId || !userId) return;

      // Update unread messages sent to this recipient
      await Message.updateMany(
        { roomId, recipient: userId, read: false },
        { $set: { read: true } }
      );

      // Notify other user in the room that messages were read
      io.to(roomId).emit('messages_read', { roomId, readerId: userId });
    } catch (err) {
      console.error('Socket mark_as_read error:', err.message);
    }
  });

  // 4. Send and Persist Message
  socket.on('send_message', async (data) => {
    try {
      const { roomId, senderId, recipientId, text } = data;
      if (!roomId || !senderId || !recipientId || !text?.trim()) return;

      // Persist to MongoDB
      const savedDoc = await Message.create({
        roomId,
        sender: senderId,
        recipient: recipientId,
        text: text.trim(),
        read: false,
      });

      const populated = await savedDoc.populate('sender', 'username profilePic fullName');

      // Broadcast payload to both users in the room
      io.to(roomId).emit('receive_message', {
        _id: populated._id,
        roomId: populated.roomId,
        senderId: populated.sender._id.toString(),
        senderName: populated.sender.username,
        text: populated.text,
        read: populated.read,
        createdAt: populated.createdAt,
      });
    } catch (err) {
      console.error('Socket send_message error:', err.message);
    }
  });

  // Disconnect handler
  socket.on('disconnect', () => {
    console.log(`Socket Client Disconnected: ${socket.id}`);
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

// Server Initialization
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Chalchitra server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});