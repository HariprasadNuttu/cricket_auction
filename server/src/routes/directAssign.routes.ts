import { Router } from 'express';
import { 
    directAssignPlayer, 
    bulkDirectAssign, 
    removeDirectAssignment,
    uploadMiddleware
} from '../controllers/directAssignController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/seasons/:seasonId/direct-assign', authenticateToken, directAssignPlayer);
router.post('/seasons/:seasonId/direct-assign/bulk', authenticateToken, uploadMiddleware, bulkDirectAssign);
router.post('/seasons/:seasonId/direct-assign/remove', authenticateToken, removeDirectAssignment);

export default router;
