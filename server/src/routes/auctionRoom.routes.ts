import { Router } from 'express';
import {
    getAuctionRooms,
    createAuctionRoom,
    getAuctionRoomById,
    deleteAuctionRoom,
    getAuctioneers
} from '../controllers/auctionRoomController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/auctioneers', authenticateToken, getAuctioneers);
router.get('/', authenticateToken, getAuctionRooms);
router.post('/', authenticateToken, createAuctionRoom);
router.get('/:id', authenticateToken, getAuctionRoomById);
router.delete('/:id', authenticateToken, deleteAuctionRoom);

export default router;
