import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes';
import auctionRoutes from './routes/auction.routes';

const app = express();

app.use(cors({
    origin: 'http://localhost:4200', // Allow Angular client
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/auction', auctionRoutes);

app.get('/health', (req, res) => {
    res.send('OK');
});

export default app;
