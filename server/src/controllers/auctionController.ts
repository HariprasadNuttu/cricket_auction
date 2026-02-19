import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getAuctionState = async (req: Request, res: Response) => {
    try {
        const state = await prisma.auctionState.findUnique({ where: { id: 1 } });
        const teams = await prisma.team.findMany();
        const players = await prisma.player.findMany({ orderBy: { id: 'asc' } });

        // Attach current player details if exists
        let currentPlayer = null;
        if (state?.currentPlayerId) {
            currentPlayer = await prisma.player.findUnique({ where: { id: state.currentPlayerId } });
        }

        res.json({ state, teams, players, currentPlayer });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch auction state' });
    }
};

export const startAuction = async (req: Request, res: Response) => {
    // Only Admin
    try {
        const { playerId } = req.body;

        // Update Auction State
        await prisma.auctionState.update({
            where: { id: 1 },
            data: {
                status: 'LIVE',
                currentPlayerId: playerId,
                currentPrice: 20, // Base price logic needed
                currentBidderTeamId: null,
                timerEndsAt: new Date(Date.now() + 15000)
            }
        });

        res.json({ message: 'Auction started for player' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to start auction' });
    }
};
