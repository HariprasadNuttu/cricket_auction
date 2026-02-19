import { Server, Socket } from 'socket.io';
import { registerAuctionHandlers } from './auctionHandler';
import { setSocketIO } from '../controllers/auctionController';

export const initializeSocket = (io: Server) => {
    // Set io instance for broadcasting from controllers
    setSocketIO(io);

    io.on('connection', (socket: Socket) => {
        console.log('User connected:', socket.id);

        // Auth check could go here using socket.handshake.auth.token

        registerAuctionHandlers(io, socket);

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });
};
