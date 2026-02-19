import { Router } from 'express';
import { getAuctionState, startAuction, startRandomAuction, completeAuction } from '../controllers/auctionController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/state', authenticateToken, getAuctionState);
router.post('/start', authenticateToken, startAuction);
router.post('/start-random', authenticateToken, startRandomAuction);
router.post('/complete', authenticateToken, completeAuction);

export default router;
