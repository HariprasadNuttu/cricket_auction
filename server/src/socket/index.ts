import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { registerAuctionHandlers } from './auctionHandler';
import { setSocketIO } from '../controllers/auctionController';

// WebSocket authentication middleware
const authenticateSocket = (socket: Socket, next: any) => {
    try {
        // Get token from handshake auth or query
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;
        
        if (!token) {
            console.warn('Socket connection without token:', socket.id);
            // Allow connection but mark as unauthenticated
            (socket as any).user = null;
            return next();
        }

        const secret = process.env.JWT_SECRET || 'supersecretkey';
        const decoded = jwt.verify(token as string, secret) as any;
        
        // Attach user info to socket
        (socket as any).user = decoded;
        console.log('Socket authenticated:', socket.id, 'User:', decoded.userId, 'Role:', decoded.role);
        
        next();
    } catch (error: any) {
        console.warn('Socket authentication failed:', socket.id, error.message);
        // Allow connection but mark as unauthenticated
        (socket as any).user = null;
        next();
    }
};

export const initializeSocket = (io: Server) => {
    // Set io instance for broadcasting from controllers
    setSocketIO(io);

    // Apply authentication middleware
    io.use(authenticateSocket);

    io.on('connection', (socket: Socket) => {
        const user = (socket as any).user;
        console.log('User connected:', socket.id, user ? `(Authenticated: ${user.role})` : '(Unauthenticated)');

        registerAuctionHandlers(io, socket);

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });
};
