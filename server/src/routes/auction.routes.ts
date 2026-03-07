import { Router } from 'express';
import { getAuctionState, startAuction, startRandomAuction, completeAuction, pauseAuction, resumeAuction, undoLastBid, reopenPlayer } from '../controllers/auctionController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/state', authenticateToken, getAuctionState);
router.post('/start', authenticateToken, startAuction);
router.post('/start-random', authenticateToken, startRandomAuction);
router.post('/complete', authenticateToken, completeAuction);
router.post('/pause', authenticateToken, pauseAuction);
router.post('/resume', authenticateToken, resumeAuction);
router.post('/undo-bid', authenticateToken, undoLastBid);
router.post('/reopen-player', authenticateToken, reopenPlayer);

export default router;
