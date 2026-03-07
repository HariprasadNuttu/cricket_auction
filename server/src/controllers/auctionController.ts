import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { Server } from 'socket.io';

interface AuthRequest extends Request {
    user?: any;
}

// Store io instance for broadcasting
let ioInstance: Server | null = null;

export const setSocketIO = (io: Server) => {
    ioInstance = io;
};

export const getAuctionState = async (req: AuthRequest, res: Response) => {
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

export const startAuction = async (req: AuthRequest, res: Response) => {
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
        const timerEndsAt = new Date(Date.now() + 60000); // 1 minute timer
        await prisma.auctionState.update({
            where: { id: 1 },
            data: {
                status: 'LIVE',
                currentPlayerId: playerId,
                currentPrice: player.basePrice,
                currentBidderTeamId: null,
                timerEndsAt: timerEndsAt
            }
        });

        // Broadcast auction start
        if (ioInstance) {
            ioInstance.emit('AUCTION_UPDATE', {
                currentPrice: player.basePrice,
                currentBidderTeamId: null,
                timerEndsAt: timerEndsAt,
                status: 'LIVE'
            });
        }

        res.json({ message: 'Auction started for player', playerId });
    } catch (error) {
        console.error('Error starting auction:', error);
        res.status(500).json({ error: 'Failed to start auction' });
    }
};

export const startRandomAuction = async (req: AuthRequest, res: Response) => {
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

export const pauseAuction = async (req: AuthRequest, res: Response) => {
    // Only Admin
    try {
        const auctionState = await prisma.auctionState.findUnique({ where: { id: 1 } });
        
        if (!auctionState || auctionState.status !== 'LIVE') {
            return res.status(400).json({ error: 'No live auction to pause' });
        }

        // Calculate remaining time
        let remainingTime = 0;
        if (auctionState.timerEndsAt) {
            const now = new Date();
            const endsAt = new Date(auctionState.timerEndsAt);
            remainingTime = Math.max(0, endsAt.getTime() - now.getTime());
        }

        // Update status to PAUSED
        // Store the future end time (current time + remaining time) so we can resume correctly
        await prisma.auctionState.update({
            where: { id: 1 },
            data: {
                status: 'PAUSED',
                timerEndsAt: remainingTime > 0 ? new Date(Date.now() + remainingTime) : null
            }
        });

        // Audit log
        await prisma.auctionLog.create({
            data: {
                eventType: 'timer_paused',
                userId: req.user?.userId || null,
                playerId: auctionState.currentPlayerId,
                details: JSON.stringify({
                    remainingTime: remainingTime,
                    currentPrice: auctionState.currentPrice
                })
            }
        });

        // Broadcast pause
        if (ioInstance) {
            ioInstance.emit('AUCTION_UPDATE', {
                currentPrice: auctionState.currentPrice,
                currentBidderTeamId: auctionState.currentBidderTeamId,
                timerEndsAt: null,
                status: 'PAUSED'
            });
        }

        res.json({ message: 'Auction paused', remainingTime });
    } catch (error) {
        console.error('Error pausing auction:', error);
        res.status(500).json({ error: 'Failed to pause auction' });
    }
};

export const resumeAuction = async (req: AuthRequest, res: Response) => {
    // Only Admin
    try {
        const auctionState = await prisma.auctionState.findUnique({ where: { id: 1 } });
        
        if (!auctionState || auctionState.status !== 'PAUSED') {
            return res.status(400).json({ error: 'No paused auction to resume' });
        }

        // Calculate remaining time from stored timerEndsAt
        let timerEndsAt = null;
        if (auctionState.timerEndsAt) {
            const now = new Date();
            const storedEndsAt = new Date(auctionState.timerEndsAt);
            const remainingTime = Math.max(0, storedEndsAt.getTime() - now.getTime());
            if (remainingTime > 0) {
                timerEndsAt = new Date(Date.now() + remainingTime);
            } else {
                // If time expired while paused, give 1 minute
                timerEndsAt = new Date(Date.now() + 60000);
            }
        } else {
            // If no stored time, give 1 minute
            timerEndsAt = new Date(Date.now() + 60000);
        }

        // Update status to LIVE
        await prisma.auctionState.update({
            where: { id: 1 },
            data: {
                status: 'LIVE',
                timerEndsAt: timerEndsAt
            }
        });

        // Audit log
        await prisma.auctionLog.create({
            data: {
                eventType: 'timer_resumed',
                userId: req.user?.userId || null,
                playerId: auctionState.currentPlayerId,
                details: JSON.stringify({
                    timerEndsAt: timerEndsAt,
                    currentPrice: auctionState.currentPrice
                })
            }
        });

        // Broadcast resume
        if (ioInstance) {
            ioInstance.emit('AUCTION_UPDATE', {
                currentPrice: auctionState.currentPrice,
                currentBidderTeamId: auctionState.currentBidderTeamId,
                timerEndsAt: timerEndsAt,
                status: 'LIVE'
            });
        }

        res.json({ message: 'Auction resumed', timerEndsAt });
    } catch (error) {
        console.error('Error resuming auction:', error);
        res.status(500).json({ error: 'Failed to resume auction' });
    }
};

export const completeAuction = async (req: AuthRequest, res: Response) => {
    // Only Admin - Can complete from LIVE or PAUSED state
    try {
        const auctionState = await prisma.auctionState.findUnique({ where: { id: 1 } });
        
        if (!auctionState || (auctionState.status !== 'LIVE' && auctionState.status !== 'PAUSED') || !auctionState.currentPlayerId) {
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

            // Audit log for player sold
            await prisma.auctionLog.create({
                data: {
                    eventType: 'player_sold',
                    userId: req.user?.userId || null,
                    teamId: auctionState.currentBidderTeamId,
                    playerId: player.id,
                    amount: auctionState.currentPrice,
                    details: JSON.stringify({
                        soldPrice: auctionState.currentPrice,
                        teamName: winningTeam.name
                    })
                }
            });

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

export const undoLastBid = async (req: AuthRequest, res: Response) => {
    // Only Admin
    try {
        const auctionState = await prisma.auctionState.findUnique({ where: { id: 1 } });
        
        if (!auctionState || (auctionState.status !== 'LIVE' && auctionState.status !== 'PAUSED') || !auctionState.currentPlayerId) {
            return res.status(400).json({ error: 'No active auction to undo bid' });
        }

        // Get the last bid for current player
        const lastBid = await prisma.bidLog.findFirst({
            where: { 
                playerId: auctionState.currentPlayerId,
                isUndone: false
            },
            orderBy: { timestamp: 'desc' },
            include: {
                team: true
            }
        });

        if (!lastBid) {
            return res.status(404).json({ error: 'No bid to undo' });
        }

        // Get the second-to-last bid (or base price if no previous bid)
        const previousBid = await prisma.bidLog.findFirst({
            where: { 
                playerId: auctionState.currentPlayerId,
                isUndone: false,
                id: { not: lastBid.id }
            },
            orderBy: { timestamp: 'desc' }
        });

        const previousPrice = previousBid ? previousBid.amount : (await prisma.player.findUnique({ 
            where: { id: auctionState.currentPlayerId } 
        }))?.basePrice || 0;

        // Update auction state to previous bid
        await prisma.$transaction([
            prisma.auctionState.update({
                where: { id: 1 },
                data: {
                    currentPrice: previousPrice,
                    currentBidderTeamId: previousBid ? previousBid.teamId : null
                }
            }),
            prisma.bidLog.update({
                where: { id: lastBid.id },
                data: { isUndone: true }
            }),
            prisma.auctionLog.create({
                data: {
                    eventType: 'bid_undone',
                    userId: req.user?.userId || null,
                    teamId: lastBid.teamId,
                    playerId: auctionState.currentPlayerId,
                    amount: lastBid.amount,
                    details: JSON.stringify({
                        undoneBid: lastBid.amount,
                        revertedTo: previousPrice
                    })
                }
            })
        ]);

        // Broadcast update
        if (ioInstance) {
            ioInstance.emit('AUCTION_UPDATE', {
                currentPrice: previousPrice,
                currentBidderTeamId: previousBid ? previousBid.teamId : null,
                timerEndsAt: auctionState.timerEndsAt,
                status: auctionState.status
            });
        }

        res.json({ 
            message: 'Last bid undone',
            previousPrice: previousPrice,
            undoneBid: lastBid.amount
        });
    } catch (error) {
        console.error('Error undoing bid:', error);
        res.status(500).json({ error: 'Failed to undo bid' });
    }
};

export const reopenPlayer = async (req: AuthRequest, res: Response) => {
    // Only Admin - Reopen a sold/unsold player for re-auction
    try {
        const { playerId } = req.body;

        const player = await prisma.player.findUnique({ where: { id: playerId } });
        if (!player) {
            return res.status(404).json({ error: 'Player not found' });
        }

        if (player.status !== 'SOLD' && player.status !== 'UNSOLD') {
            return res.status(400).json({ error: 'Player is already active' });
        }

        // Get the team if player was sold
        let previousTeam = null;
        if (player.status === 'SOLD' && player.teamId) {
            previousTeam = await prisma.team.findUnique({ where: { id: player.teamId } });
        }

        await prisma.$transaction(async (tx) => {
            // Revert team changes if player was sold
            if (player.status === 'SOLD' && previousTeam && player.soldPrice) {
                await tx.team.update({
                    where: { id: previousTeam.id },
                    data: {
                        remainingBudget: { increment: player.soldPrice },
                        totalPlayers: { decrement: 1 }
                    }
                });
            }

            // Mark player as ACTIVE
            await tx.player.update({
                where: { id: playerId },
                data: {
                    status: 'ACTIVE',
                    teamId: null,
                    soldPrice: null
                }
            });

            // Audit log
            await tx.auctionLog.create({
                data: {
                    eventType: 'player_reopened',
                    userId: req.user?.userId || null,
                    playerId: playerId,
                    teamId: previousTeam?.id || null,
                    details: JSON.stringify({
                        previousStatus: player.status,
                        previousSoldPrice: player.soldPrice,
                        previousTeam: previousTeam?.name || null
                    })
                }
            });
        });

        res.json({ 
            message: 'Player reopened for auction',
            playerId: playerId
        });
    } catch (error) {
        console.error('Error reopening player:', error);
        res.status(500).json({ error: 'Failed to reopen player' });
    }
};
