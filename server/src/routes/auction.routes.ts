import { Router } from 'express';
import { 
    getAuctionState, 
    startAuction, 
    startRandomAuction, 
    completeAuction, 
    pauseAuction, 
    resumeAuction, 
    undoLastBid, 
    reopenPlayer 
} from '../controllers/auctionController';
import { authenticateToken } from '../middleware/auth';
import { canControlAuction } from '../middleware/auctionControl';

const router = Router();

// Get state - any authenticated user (owners need to see auction)
router.get('/seasons/:seasonId/state', authenticateToken, getAuctionState);
// Control routes - Admin or assigned Auctioneer only
router.post('/seasons/:seasonId/start', authenticateToken, canControlAuction, startAuction);
router.post('/seasons/:seasonId/start-random', authenticateToken, canControlAuction, startRandomAuction);
router.post('/seasons/:seasonId/complete', authenticateToken, canControlAuction, completeAuction);
router.post('/seasons/:seasonId/pause', authenticateToken, canControlAuction, pauseAuction);
router.post('/seasons/:seasonId/resume', authenticateToken, canControlAuction, resumeAuction);
router.post('/seasons/:seasonId/undo-bid', authenticateToken, canControlAuction, undoLastBid);
router.post('/seasons/:seasonId/reopen-player', authenticateToken, canControlAuction, reopenPlayer);

export default router;
