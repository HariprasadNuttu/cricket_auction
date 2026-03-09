import { Request, Response } from 'express';
import prisma from '../utils/prisma';

interface AuthRequest extends Request {
    user?: any;
}

export const getAuctionRooms = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        const userRole = user?.role;
        const userId = user?.userId;

        let rooms;

        if (userRole === 'ADMIN') {
            rooms = await prisma.auctionRoom.findMany({
                include: {
                    season: {
                        include: {
                            group: { select: { id: true, name: true } }
                        }
                    },
                    auctioneer: { select: { id: true, name: true, email: true } }
                },
                orderBy: { createdAt: 'desc' }
            });
        } else if (userRole === 'AUCTIONEER') {
            rooms = await prisma.auctionRoom.findMany({
                where: { auctioneerId: userId },
                include: {
                    season: {
                        include: {
                            group: { select: { id: true, name: true } }
                        }
                    },
                    auctioneer: { select: { id: true, name: true, email: true } }
                },
                orderBy: { createdAt: 'desc' }
            });
        } else {
            return res.status(403).json({ error: 'Only Admin or Auctioneer can view auction rooms' });
        }

        res.json(rooms);
    } catch (error: any) {
        console.error('Error fetching auction rooms:', error);
        res.status(500).json({ error: 'Failed to fetch auction rooms' });
    }
};

export const createAuctionRoom = async (req: AuthRequest, res: Response) => {
    try {
        if (req.user?.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Only Admin can create auction rooms' });
        }

        const { seasonId, auctioneerId, name } = req.body;

        if (!seasonId || !auctioneerId) {
            return res.status(400).json({ error: 'Season and Auctioneer are required' });
        }

        const seasonIdNum = parseInt(seasonId);
        const auctioneerIdNum = parseInt(auctioneerId);

        const season = await prisma.season.findUnique({
            where: { id: seasonIdNum },
            include: { group: true }
        });

        if (!season) {
            return res.status(404).json({ error: 'Season not found' });
        }

        const auctioneer = await prisma.user.findUnique({
            where: { id: auctioneerIdNum }
        });

        if (!auctioneer || auctioneer.role !== 'AUCTIONEER') {
            return res.status(400).json({ error: 'Selected user must have Auctioneer role' });
        }

        const existing = await prisma.auctionRoom.findUnique({
            where: { seasonId: seasonIdNum }
        });

        if (existing) {
            return res.status(400).json({ error: 'An auction room already exists for this season' });
        }

        const room = await prisma.auctionRoom.create({
            data: {
                seasonId: seasonIdNum,
                auctioneerId: auctioneerIdNum,
                name: name || `${season.name} - ${season.group.name}`
            },
            include: {
                season: {
                    include: {
                        group: { select: { id: true, name: true } }
                    }
                },
                auctioneer: { select: { id: true, name: true, email: true } }
            }
        });

        // Sync Season.auctioneerId
        await prisma.season.update({
            where: { id: seasonIdNum },
            data: { auctioneerId: auctioneerIdNum }
        });

        res.status(201).json(room);
    } catch (error: any) {
        console.error('Error creating auction room:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'An auction room already exists for this season' });
        }
        res.status(500).json({ error: 'Failed to create auction room' });
    }
};

export const getAuctionRoomById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const roomId = parseInt(id);

        const room = await prisma.auctionRoom.findUnique({
            where: { id: roomId },
            include: {
                season: {
                    include: {
                        group: { select: { id: true, name: true } }
                    }
                },
                auctioneer: { select: { id: true, name: true, email: true } }
            }
        });

        if (!room) {
            return res.status(404).json({ error: 'Auction room not found' });
        }

        const user = req.user;
        if (user?.role === 'AUCTIONEER' && room.auctioneerId !== user.userId) {
            return res.status(403).json({ error: 'Not authorized to access this auction room' });
        }

        res.json(room);
    } catch (error: any) {
        console.error('Error fetching auction room:', error);
        res.status(500).json({ error: 'Failed to fetch auction room' });
    }
};

export const deleteAuctionRoom = async (req: AuthRequest, res: Response) => {
    try {
        if (req.user?.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Only Admin can delete auction rooms' });
        }

        const { id } = req.params;
        const roomId = parseInt(id);

        const room = await prisma.auctionRoom.findUnique({
            where: { id: roomId },
            select: { seasonId: true }
        });

        await prisma.auctionRoom.delete({
            where: { id: roomId }
        });

        // Clear Season.auctioneerId
        if (room?.seasonId) {
            await prisma.season.update({
                where: { id: room.seasonId },
                data: { auctioneerId: null }
            });
        }

        res.json({ message: 'Auction room deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting auction room:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Auction room not found' });
        }
        res.status(500).json({ error: 'Failed to delete auction room' });
    }
};

export const getAuctioneers = async (req: AuthRequest, res: Response) => {
    try {
        if (req.user?.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Only Admin can list auctioneers' });
        }

        const auctioneers = await prisma.user.findMany({
            where: { role: 'AUCTIONEER' },
            select: { id: true, name: true, email: true }
        });

        res.json(auctioneers);
    } catch (error: any) {
        console.error('Error fetching auctioneers:', error);
        res.status(500).json({ error: 'Failed to fetch auctioneers' });
    }
};
