import { Router } from 'express';
import { 
    createSeason, 
    getSeasonsByGroup, 
    getSeasonById, 
    updateSeason, 
    deleteSeason,
    cloneSeason 
} from '../controllers/seasonController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Routes nested under groups
router.post('/groups/:groupId/seasons', authenticateToken, createSeason);
router.get('/groups/:groupId/seasons', authenticateToken, getSeasonsByGroup);

// Direct season routes
router.get('/seasons/:id', authenticateToken, getSeasonById);
router.put('/seasons/:id', authenticateToken, updateSeason);
router.delete('/seasons/:id', authenticateToken, deleteSeason);
router.post('/seasons/:id/clone', authenticateToken, cloneSeason);

export default router;
