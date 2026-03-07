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

const router = Router();

// All routes now require seasonId
router.get('/seasons/:seasonId/state', authenticateToken, getAuctionState);
router.post('/seasons/:seasonId/start', authenticateToken, startAuction);
router.post('/seasons/:seasonId/start-random', authenticateToken, startRandomAuction);
router.post('/seasons/:seasonId/complete', authenticateToken, completeAuction);
router.post('/seasons/:seasonId/pause', authenticateToken, pauseAuction);
router.post('/seasons/:seasonId/resume', authenticateToken, resumeAuction);
router.post('/seasons/:seasonId/undo-bid', authenticateToken, undoLastBid);
router.post('/seasons/:seasonId/reopen-player', authenticateToken, reopenPlayer);

export default router;
