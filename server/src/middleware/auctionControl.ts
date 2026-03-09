import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';

interface AuthRequest {
    user?: { userId?: number; role?: string };
    params?: { seasonId?: string };
}

export const canControlAuction = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const user = req.user;
        if (!user?.userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (user.role === 'ADMIN') {
            return next();
        }

        if (user.role === 'AUCTIONEER') {
            const seasonId = parseInt(req.params?.seasonId || '');
            if (!seasonId) {
                return res.status(400).json({ error: 'Season ID required' });
            }

            const auctionRoom = await prisma.auctionRoom.findUnique({
                where: { seasonId }
            });

            if (!auctionRoom) {
                return res.status(403).json({ error: 'No auction room exists for this season' });
            }

            if (auctionRoom.auctioneerId !== user.userId) {
                return res.status(403).json({ error: 'You are not assigned to conduct this auction' });
            }

            return next();
        }

        return res.status(403).json({ error: 'Only Admin or assigned Auctioneer can control the auction' });
    } catch (error) {
        console.error('Auction control check error:', error);
        res.status(500).json({ error: 'Authorization check failed' });
    }
};
