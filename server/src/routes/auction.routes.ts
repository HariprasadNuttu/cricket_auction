import { Router } from 'express';
import { getAuctionState, startAuction } from '../controllers/auctionController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/state', authenticateToken, getAuctionState);
router.post('/start', authenticateToken, startAuction);

export default router;
