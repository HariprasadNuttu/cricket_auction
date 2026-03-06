import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { Server } from 'socket.io';

// Store io instance for broadcasting
let ioInstance: Server | null = null;

export const setSocketIO = (io: Server) => {
    ioInstance = io;
};

export const getAuctionState = async (req: Request, res: Response) => {
    try {
        const state = await prisma.auctionState.findUnique({ where: { id: 1 } });
        const teams = await prisma.team.findMany();
        const players = await prisma.player.findMany({ orderBy: { id: 'asc' } });

        // Attach current player details if exists
        let currentPlayer = null;
        let bidHistory: any[] = [];
        if (state?.currentPlayerId) {
            currentPlayer = await prisma.player.findUnique({ where: { id: state.currentPlayerId } });
            
            // Get bid history for current player
            bidHistory = await prisma.bidLog.findMany({
                where: { playerId: state.currentPlayerId },
                include: {
                    team: {
                        select: { id: true, name: true }
                    },
                    user: {
                        select: { id: true, name: true, role: true }
                    }
                },
                orderBy: { timestamp: 'desc' },
                take: 20 // Last 20 bids
            });
        }

        res.json({ state, teams, players, currentPlayer, bidHistory });
    } catch (error) {
        console.error('Error fetching auction state:', error);
        res.status(500).json({ error: 'Failed to fetch auction state' });
    }
};

export const startAuction = async (req: Request, res: Response) => {
    // Only Admin
    try {
        const { playerId } = req.body;

        // Get player to get base price
        const player = await prisma.player.findUnique({ where: { id: playerId } });
        if (!player) {
            return res.status(404).json({ error: 'Player not found' });
        }

        if (player.status !== 'ACTIVE') {
            return res.status(400).json({ error: 'Player is not available for auction' });
        }

        // Update Auction State
        await prisma.auctionState.update({
            where: { id: 1 },
            data: {
                status: 'LIVE',
                currentPlayerId: playerId,
                currentPrice: player.basePrice,
                currentBidderTeamId: null,
                timerEndsAt: new Date(Date.now() + 60000) // 1 minute timer
            }
        });

        res.json({ message: 'Auction started for player', playerId });
    } catch (error) {
        console.error('Error starting auction:', error);
        res.status(500).json({ error: 'Failed to start auction' });
    }
};

export const startRandomAuction = async (req: Request, res: Response) => {
    // Only Admin
    try {
        // Get all active players
        const activePlayers = await prisma.player.findMany({
            where: { status: 'ACTIVE' }
        });

        if (activePlayers.length === 0) {
            return res.status(404).json({ error: 'No active players available' });
        }

        // Pick a random player
        const randomIndex = Math.floor(Math.random() * activePlayers.length);
        const randomPlayer = activePlayers[randomIndex];

        res.json({ 
            message: 'Random player selected', 
            playerId: randomPlayer.id,
            player: {
                id: randomPlayer.id,
                name: randomPlayer.name,
                category: randomPlayer.category,
                basePrice: randomPlayer.basePrice
            }
        });
    } catch (error) {
        console.error('Error selecting random player:', error);
        res.status(500).json({ error: 'Failed to select random player' });
    }
};

export const completeAuction = async (req: Request, res: Response) => {
    // Only Admin
    try {
        const auctionState = await prisma.auctionState.findUnique({ where: { id: 1 } });
        
        if (!auctionState || auctionState.status !== 'LIVE' || !auctionState.currentPlayerId) {
            return res.status(400).json({ error: 'No active auction to complete' });
        }

        const player = await prisma.player.findUnique({ where: { id: auctionState.currentPlayerId } });
        if (!player) {
            return res.status(404).json({ error: 'Player not found' });
        }

        // Check if there's a winning bidder
        if (auctionState.currentBidderTeamId && auctionState.currentPrice > player.basePrice) {
            // Player is sold
            const winningTeam = await prisma.team.findUnique({ 
                where: { id: auctionState.currentBidderTeamId } 
            });

            if (!winningTeam) {
                return res.status(404).json({ error: 'Winning team not found' });
            }

            // Update player status and assign to team
            await prisma.$transaction([
                prisma.player.update({
                    where: { id: player.id },
                    data: {
                        status: 'SOLD',
                        soldPrice: auctionState.currentPrice,
                        teamId: auctionState.currentBidderTeamId
                    }
                }),
                prisma.team.update({
                    where: { id: auctionState.currentBidderTeamId },
                    data: {
                        remainingBudget: { decrement: auctionState.currentPrice },
                        totalPlayers: { increment: 1 }
                    }
                }),
                prisma.auctionState.update({
                    where: { id: 1 },
                    data: {
                        status: 'READY',
                        currentPlayerId: null,
                        currentPrice: 0,
                        currentBidderTeamId: null,
                        timerEndsAt: null
                    }
                })
            ]);

            // Broadcast auction completion
            if (ioInstance) {
                ioInstance.emit('AUCTION_COMPLETE', {
                    playerId: player.id,
                    status: 'SOLD',
                    teamId: auctionState.currentBidderTeamId,
                    soldPrice: auctionState.currentPrice
                });
            }

            res.json({ 
                message: 'Player sold successfully',
                playerId: player.id,
                teamId: auctionState.currentBidderTeamId,
                soldPrice: auctionState.currentPrice
            });
        } else {
            // No valid bid, mark as unsold
            await prisma.$transaction([
                prisma.player.update({
                    where: { id: player.id },
                    data: {
                        status: 'UNSOLD'
                    }
                }),
                prisma.auctionState.update({
                    where: { id: 1 },
                    data: {
                        status: 'READY',
                        currentPlayerId: null,
                        currentPrice: 0,
                        currentBidderTeamId: null,
                        timerEndsAt: null
                    }
                })
            ]);

            // Broadcast auction completion
            if (ioInstance) {
                ioInstance.emit('AUCTION_COMPLETE', {
                    playerId: player.id,
                    status: 'UNSOLD'
                });
            }

            res.json({ 
                message: 'Player marked as unsold',
                playerId: player.id
            });
        }
    } catch (error) {
        console.error('Error completing auction:', error);
        res.status(500).json({ error: 'Failed to complete auction' });
    }
};
