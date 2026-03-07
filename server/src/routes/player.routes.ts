import { Router } from 'express';
import { 
    addPlayerToGroup,
    uploadPlayersCSV,
    getPlayersByGroup,
    updatePlayer,
    deletePlayer,
    addPlayersToSeason,
    getPlayersBySeason,
    updateSeasonPlayer,
    removePlayerFromSeason,
    uploadMiddleware
} from '../controllers/playerController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Group-level player routes
router.post('/groups/:groupId/players', authenticateToken, addPlayerToGroup);
router.post('/groups/:groupId/players/upload', authenticateToken, uploadMiddleware, uploadPlayersCSV);
router.get('/groups/:groupId/players', authenticateToken, getPlayersByGroup);
router.put('/players/:id', authenticateToken, updatePlayer);
router.delete('/players/:id', authenticateToken, deletePlayer);

// Season-level player routes
router.post('/seasons/:seasonId/players', authenticateToken, addPlayersToSeason);
router.get('/seasons/:seasonId/players', authenticateToken, getPlayersBySeason);
router.put('/season-players/:id', authenticateToken, updateSeasonPlayer);
router.delete('/season-players/:id', authenticateToken, removePlayerFromSeason);

export default router;
