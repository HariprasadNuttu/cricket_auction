import { Router } from 'express';
import {
    getTeamsBySeason,
    createTeam,
    updateTeam,
    deleteTeam
} from '../controllers/teamController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/seasons/:seasonId/teams', authenticateToken, getTeamsBySeason);
router.post('/seasons/:seasonId/teams', authenticateToken, createTeam);
router.put('/teams/:teamId', authenticateToken, updateTeam);
router.delete('/teams/:teamId', authenticateToken, deleteTeam);

export default router;
