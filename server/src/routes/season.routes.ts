import { Router } from 'express';
import { 
    createSeason, 
    getSeasonsByGroup, 
    getSeasonById, 
    updateSeason, 
    deleteSeason,
    cloneSeason 
} from '../controllers/seasonController';
import {
    getTeamsBySeason,
    getTeamsPlayersMapping,
    createTeam,
    updateTeam,
    deleteTeam
} from '../controllers/teamController';
import {
    getSeasonOwners,
    addSeasonOwner,
    removeSeasonOwner
} from '../controllers/seasonOwnerController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Routes nested under groups
router.post('/groups/:groupId/seasons', authenticateToken, createSeason);
router.get('/groups/:groupId/seasons', authenticateToken, getSeasonsByGroup);

// Season owners (scoped per season - not shared across groups)
router.get('/seasons/:seasonId/owners', authenticateToken, getSeasonOwners);
router.post('/seasons/:seasonId/owners', authenticateToken, addSeasonOwner);
router.delete('/seasons/:seasonId/owners/:userId', authenticateToken, removeSeasonOwner);

// Team routes (must be before /seasons/:id to avoid :id capturing "2" in /seasons/2/teams)
router.get('/seasons/:seasonId/teams', authenticateToken, getTeamsBySeason);
router.get('/seasons/:seasonId/teams/players-mapping', authenticateToken, getTeamsPlayersMapping);
router.post('/seasons/:seasonId/teams', authenticateToken, createTeam);

// Direct season routes
router.get('/seasons/:id', authenticateToken, getSeasonById);
router.put('/seasons/:id', authenticateToken, updateSeason);
router.delete('/seasons/:id', authenticateToken, deleteSeason);
router.post('/seasons/:id/clone', authenticateToken, cloneSeason);

// Team update/delete (by teamId)
router.put('/teams/:teamId', authenticateToken, updateTeam);
router.delete('/teams/:teamId', authenticateToken, deleteTeam);

export default router;
