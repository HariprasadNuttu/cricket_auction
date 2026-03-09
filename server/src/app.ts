import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes';
import auctionRoutes from './routes/auction.routes';
import groupRoutes from './routes/group.routes';
import seasonRoutes from './routes/season.routes';
import playerRoutes from './routes/player.routes';
import directAssignRoutes from './routes/directAssign.routes';
import auctionRoomRoutes from './routes/auctionRoom.routes';

const app = express();

app.use(cors({
    origin: 'http://localhost:4200', // Allow Angular client
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/auction', auctionRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api', seasonRoutes); // Season routes include both /groups/:groupId/seasons and /seasons/:id
app.use('/api', playerRoutes); // Player routes include both /groups/:groupId/players and /seasons/:seasonId/players
app.use('/api', directAssignRoutes);
app.use('/api/auction-rooms', auctionRoomRoutes);

app.get('/health', (req, res) => {
    res.send('OK');
});

// Debug endpoint to test token (remove in production)
app.get('/api/debug/token', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.json({ error: 'No token provided' });
    }
    
    try {
        const jwt = require('jsonwebtoken');
        const secret = process.env.JWT_SECRET || 'supersecretkey';
        const decoded = jwt.decode(token, { complete: true });
        
        res.json({
            tokenPresent: !!token,
            tokenLength: token.length,
            secretUsed: secret.substring(0, 10) + '...',
            decoded: decoded,
            isValid: (() => {
                try {
                    jwt.verify(token, secret);
                    return true;
                } catch (e: any) {
                    return { valid: false, error: e.message };
                }
            })()
        });
    } catch (error: any) {
        res.json({ error: error.message });
    }
});

export default app;
