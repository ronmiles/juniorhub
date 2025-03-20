import { Server as SocketServer, Socket } from 'socket.io';
import { Server } from 'http';
import { verifyAccessToken } from './jwt';

let io: SocketServer;

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

// Initialize Socket.IO server
export const initSocketServer = (server: Server) => {
  io = new SocketServer(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:4200',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication middleware
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }
    
    const decoded = verifyAccessToken(token);
    
    if (!decoded) {
      return next(new Error('Authentication error'));
    }
    
    (socket as AuthenticatedSocket).userId = decoded.userId;
    next();
  });

  // Connection handler
  io.on('connection', (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket;
    console.log(`User connected: ${authSocket.userId}`);
    
    // Join a room specific to this user
    if (authSocket.userId) {
      socket.join(`user-${authSocket.userId}`);
    }
    
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${authSocket.userId}`);
    });
  });

  return io;
};

// Send notification to a specific user
export const sendNotificationToUser = (userId: string, notification: any) => {
  if (io) {
    io.to(`user-${userId}`).emit('notification', notification);
  }
};

// Get the Socket.IO instance
export const getIO = (): SocketServer => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}; 