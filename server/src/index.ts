import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import app from './app';
import { initializeSocket } from './socket/index';

dotenv.config();

const httpServer = createServer(app);

// Railway: prevent proxy from closing idle WebSocket connections (~30–60s)
httpServer.keepAliveTimeout = 65000;
httpServer.headersTimeout = 66000;

const staticSocketOrigin = process.env.CLIENT_ORIGIN || process.env.ORIGIN;
const io = new Server(httpServer, {
    cors: {
        origin: staticSocketOrigin || true,
        methods: ["GET", "POST"],
        credentials: true
    },
    // Railway: ping-pong heartbeat keeps WebSocket connections alive
    pingInterval: 25000,
    pingTimeout: 60000
});

// Initialize socket handlers
initializeSocket(io);

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

httpServer.listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
});
