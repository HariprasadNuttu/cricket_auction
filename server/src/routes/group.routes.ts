import { Router } from 'express';
import { createGroup, getGroups, getGroupById, updateGroup, deleteGroup } from '../controllers/groupController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/', authenticateToken, createGroup);
router.get('/', authenticateToken, getGroups);
router.get('/:id', authenticateToken, getGroupById);
router.put('/:id', authenticateToken, updateGroup);
router.delete('/:id', authenticateToken, deleteGroup);

export default router;
