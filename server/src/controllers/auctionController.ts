import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { Server } from 'socket.io';
import { AUCTION_BID_TIMER_MS } from '../config/auction';
import { maxPlayersForSeason } from '../utils/seasonPlayerLimits';

interface AuthRequest extends Request {
    user?: any;
}

// Store io instance for broadcasting
let ioInstance: Server | null = null;

export const setSocketIO = (io: Server) => {
    ioInstance = io;
};

// Updated to work with seasons
export const getAuctionState = async (req: AuthRequest, res: Response) => {
    try {
        const { seasonId } = req.params;
        const seasonIdNum = parseInt(seasonId);

        if (!seasonIdNum) {
            return res.status(400).json({ error: 'Season ID is required' });
        }

        // Verify season exists
        const season = await prisma.season.findUnique({
            where: { id: seasonIdNum },
            include: {
                group: {
                    select: { id: true, name: true }
                }
            }
        });

        if (!season) {
            return res.status(404).json({ error: 'Season not found' });
        }

        // Get auction state for season
        let state = await prisma.auctionState.findUnique({ 
            where: { seasonId: seasonIdNum } 
        });

        // Create if doesn't exist
        if (!state) {
            state = await prisma.auctionState.create({
                data: {
                    seasonId: seasonIdNum,
                    status: 'READY',
                    currentPrice: 0,
                    version: 0
                }
            });
        }

        // Get teams for this season
        const teams = await prisma.team.findMany({
            where: { seasonId: seasonIdNum },
            include: {
                owner: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        // Get season players (not group players)
        const seasonPlayers = await prisma.seasonPlayer.findMany({
            where: { seasonId: seasonIdNum },
            include: {
                player: true,
                team: {
                    select: { id: true, name: true }
                }
            },
            orderBy: { id: 'asc' }
        });

        // Attach current player details if exists
        let currentSeasonPlayer = null;
        let bidHistory: any[] = [];
        
        if (state.currentPlayerId) {
            // currentPlayerId now refers to SeasonPlayer.id
            currentSeasonPlayer = await prisma.seasonPlayer.findUnique({ 
                where: { id: state.currentPlayerId },
                include: {
                    player: true,
                    team: {
                        select: { id: true, name: true }
                    }
                }
            });
            
            if (currentSeasonPlayer) {
                // Get bid history for current player (using playerId from SeasonPlayer)
                bidHistory = await prisma.bidLog.findMany({
                    where: { 
                        seasonId: seasonIdNum,
                        playerId: currentSeasonPlayer.playerId 
                    },
                    include: {
                        team: {
                            select: { id: true, name: true }
                        },
                        user: {
                            select: { id: true, name: true, role: true }
                        }
                    },
                    orderBy: { timestamp: 'desc' },
                    take: 20
                });
            }
        }

        // Flatten currentPlayer for client (includes imageUrl for auction display)
        const currentPlayer = currentSeasonPlayer ? {
            ...currentSeasonPlayer.player,
            id: currentSeasonPlayer.playerId,
            soldPrice: currentSeasonPlayer.soldPrice,
            team: currentSeasonPlayer.team
        } : null;

        res.json({ 
            state, 
            season,
            teams, 
            seasonPlayers,
            players: seasonPlayers, // alias for client compatibility
            currentSeasonPlayer, 
            currentPlayer,
            bidHistory 
        });
    } catch (error) {
        console.error('Error fetching auction state:', error);
        res.status(500).json({ error: 'Failed to fetch auction state' });
    }
};

export const startAuction = async (req: AuthRequest, res: Response) => {
    try {
        const { seasonId } = req.params;
        const { seasonPlayerId } = req.body; // Now uses SeasonPlayer.id
        const seasonIdNum = parseInt(seasonId);

        if (!seasonIdNum) {
            return res.status(400).json({ error: 'Season ID is required' });
        }

        // Get season player
        const seasonPlayer = await prisma.seasonPlayer.findUnique({
            where: { id: seasonPlayerId },
            include: {
                player: true,
                season: true
            }
        });

        if (!seasonPlayer) {
            return res.status(404).json({ error: 'Season player not found' });
        }

        if (seasonPlayer.seasonId !== seasonIdNum) {
            return res.status(400).json({ error: 'Season player does not belong to this season' });
        }

        if (seasonPlayer.status !== 'ACTIVE') {
            return res.status(400).json({ error: 'Player is not available for auction' });
        }

        // Prevent auction for directly assigned players
        if (seasonPlayer.soldType === 'DIRECT_ASSIGN') {
            return res.status(400).json({ 
                error: 'Player is directly assigned. Cannot auction directly assigned players.' 
            });
        }

        // Get or create auction state
        let auctionState = await prisma.auctionState.findUnique({
            where: { seasonId: seasonIdNum }
        });

        if (!auctionState) {
            auctionState = await prisma.auctionState.create({
                data: {
                    seasonId: seasonIdNum,
                    status: 'READY'
                }
            });
        }

        // Update Auction State
        const timerEndsAt = new Date(Date.now() + AUCTION_BID_TIMER_MS);
        await prisma.auctionState.update({
            where: { seasonId: seasonIdNum },
            data: {
                status: 'LIVE',
                currentPlayerId: seasonPlayerId,
                currentPrice: seasonPlayer.player.basePrice,
                currentBidderTeamId: null,
                timerEndsAt: timerEndsAt
            }
        });

        // Broadcast auction start
        if (ioInstance) {
            ioInstance.emit('AUCTION_UPDATE', {
                seasonId: seasonIdNum,
                currentPrice: seasonPlayer.player.basePrice,
                currentBidderTeamId: null,
                timerEndsAt: timerEndsAt,
                status: 'LIVE'
            });
        }

        res.json({ 
            message: 'Auction started for player', 
            seasonPlayerId,
            player: seasonPlayer.player 
        });
    } catch (error) {
        console.error('Error starting auction:', error);
        res.status(500).json({ error: 'Failed to start auction' });
    }
};

export const startRandomAuction = async (req: AuthRequest, res: Response) => {
    try {
        const { seasonId } = req.params;
        const seasonIdNum = parseInt(seasonId);

        if (!seasonIdNum) {
            return res.status(400).json({ error: 'Season ID is required' });
        }

        // Get all active season players (exclude directly assigned players)
        const activeSeasonPlayers = await prisma.seasonPlayer.findMany({
            where: { 
                seasonId: seasonIdNum,
                status: 'ACTIVE',
                soldType: null // Only players not directly assigned
            },
            include: {
                player: true
            }
        });

        if (activeSeasonPlayers.length === 0) {
            return res.status(400).json({ error: 'No active players available for auction' });
        }

        // Select random player
        const randomIndex = Math.floor(Math.random() * activeSeasonPlayers.length);
        const selectedSeasonPlayer = activeSeasonPlayers[randomIndex];

        res.json({ 
            seasonPlayerId: selectedSeasonPlayer.id,
            player: selectedSeasonPlayer.player
        });
    } catch (error) {
        console.error('Error selecting random player:', error);
        res.status(500).json({ error: 'Failed to select random player' });
    }
};

export const pauseAuction = async (req: AuthRequest, res: Response) => {
    try {
        const { seasonId } = req.params;
        const seasonIdNum = parseInt(seasonId);

        const auctionState = await prisma.auctionState.findUnique({ 
            where: { seasonId: seasonIdNum } 
        });
        
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
        await prisma.auctionState.update({
            where: { seasonId: seasonIdNum },
            data: {
                status: 'PAUSED',
                timerEndsAt: null
            }
        });

        // Audit log
        await prisma.auctionLog.create({
            data: {
                seasonId: seasonIdNum,
                eventType: 'timer_paused',
                userId: req.user?.userId || null,
                playerId: auctionState.currentPlayerId ? 
                    (await prisma.seasonPlayer.findUnique({ 
                        where: { id: auctionState.currentPlayerId },
                        select: { playerId: true }
                    }))?.playerId : null,
                details: JSON.stringify({
                    remainingTime: remainingTime,
                    currentPrice: auctionState.currentPrice
                })
            }
        });

        // Broadcast pause
        if (ioInstance) {
            ioInstance.emit('AUCTION_UPDATE', {
                seasonId: seasonIdNum,
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
    try {
        const { seasonId } = req.params;
        const seasonIdNum = parseInt(seasonId);

        const auctionState = await prisma.auctionState.findUnique({ 
            where: { seasonId: seasonIdNum } 
        });
        
        if (!auctionState || auctionState.status !== 'PAUSED') {
            return res.status(400).json({ error: 'No paused auction to resume' });
        }

        // Calculate timer (use stored remaining time or default bid window)
        let timerEndsAt: Date;
        const storedRemainingTime = req.body.remainingTime;
        
        if (storedRemainingTime && storedRemainingTime > 0) {
            timerEndsAt = new Date(Date.now() + storedRemainingTime);
        } else {
            timerEndsAt = new Date(Date.now() + AUCTION_BID_TIMER_MS);
        }

        // Update status to LIVE
        await prisma.auctionState.update({
            where: { seasonId: seasonIdNum },
            data: {
                status: 'LIVE',
                timerEndsAt: timerEndsAt
            }
        });

        // Audit log
        await prisma.auctionLog.create({
            data: {
                seasonId: seasonIdNum,
                eventType: 'timer_resumed',
                userId: req.user?.userId || null,
                playerId: auctionState.currentPlayerId ? 
                    (await prisma.seasonPlayer.findUnique({ 
                        where: { id: auctionState.currentPlayerId },
                        select: { playerId: true }
                    }))?.playerId : null,
                details: JSON.stringify({
                    timerEndsAt: timerEndsAt,
                    currentPrice: auctionState.currentPrice
                })
            }
        });

        // Broadcast resume
        if (ioInstance) {
            ioInstance.emit('AUCTION_UPDATE', {
                seasonId: seasonIdNum,
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
    try {
        const { seasonId } = req.params;
        const seasonIdNum = parseInt(seasonId);
        const outcome = req.body?.outcome as 'sold' | 'unsold' | undefined;

        const auctionState = await prisma.auctionState.findUnique({ 
            where: { seasonId: seasonIdNum } 
        });
        
        if (!auctionState || (auctionState.status !== 'LIVE' && auctionState.status !== 'PAUSED') || !auctionState.currentPlayerId) {
            return res.status(400).json({ error: 'No active auction to complete' });
        }

        const seasonPlayer = await prisma.seasonPlayer.findUnique({
            where: { id: auctionState.currentPlayerId },
            include: {
                player: true
            }
        });

        if (!seasonPlayer) {
            return res.status(404).json({ error: 'Season player not found' });
        }

        const basePrice = seasonPlayer.player.basePrice;

        // --- Explicit Unsold (skip auction; no sale) ---
        if (outcome === 'unsold') {
            await prisma.$transaction([
                prisma.seasonPlayer.update({
                    where: { id: seasonPlayer.id },
                    data: {
                        status: 'UNSOLD',
                        teamId: null,
                        soldPrice: null,
                        soldType: null,
                        soldAt: null
                    }
                }),
                prisma.auctionState.update({
                    where: { seasonId: seasonIdNum },
                    data: {
                        status: 'READY',
                        currentPlayerId: null,
                        currentPrice: 0,
                        currentBidderTeamId: null,
                        timerEndsAt: null
                    }
                }),
                prisma.auctionLog.create({
                    data: {
                        seasonId: seasonIdNum,
                        eventType: 'player_unsold',
                        userId: req.user?.userId || null,
                        playerId: seasonPlayer.playerId,
                        details: JSON.stringify({ reason: 'Manual unsold' })
                    }
                })
            ]);

            if (ioInstance) {
                ioInstance.emit('AUCTION_COMPLETE', {
                    seasonId: seasonIdNum,
                    seasonPlayerId: seasonPlayer.id,
                    status: 'UNSOLD'
                });
            }

            return res.json({
                message: 'Player marked as unsold',
                seasonPlayerId: seasonPlayer.id
            });
        }

        // --- Sold path: explicit "sold" OR timer/auto (strict bid above base) ---
        const explicitSold = outcome === 'sold';
        if (explicitSold && !auctionState.currentBidderTeamId) {
            return res.status(400).json({ error: 'No current bidder to sell to' });
        }
        if (explicitSold && auctionState.currentPrice < basePrice) {
            return res.status(400).json({ error: 'Invalid auction price' });
        }

        const autoSold =
            !explicitSold &&
            !!auctionState.currentBidderTeamId &&
            auctionState.currentPrice > basePrice;

        const manualSold =
            explicitSold &&
            !!auctionState.currentBidderTeamId &&
            auctionState.currentPrice >= basePrice;

        if (autoSold || manualSold) {
            const winningTeam = await prisma.team.findUnique({
                where: { id: auctionState.currentBidderTeamId! },
                include: { season: true }
            });

            if (!winningTeam) {
                return res.status(404).json({ error: 'Winning team not found' });
            }

            const maxPlayers = maxPlayersForSeason(winningTeam.season);
            if (winningTeam.totalPlayers >= maxPlayers) {
                return res.status(400).json({
                    error: `Team squad is full (${maxPlayers} players). Cannot complete this sale.`
                });
            }

            if (winningTeam.remainingBudget < auctionState.currentPrice) {
                return res.status(400).json({
                    error: `Insufficient budget. Team has ₹${winningTeam.remainingBudget} remaining; sale requires ₹${auctionState.currentPrice}.`
                });
            }

            await prisma.$transaction([
                prisma.seasonPlayer.update({
                    where: { id: seasonPlayer.id },
                    data: {
                        status: 'SOLD',
                        soldPrice: auctionState.currentPrice,
                        soldType: 'AUCTION',
                        soldAt: new Date(),
                        teamId: auctionState.currentBidderTeamId
                    }
                }),
                prisma.team.update({
                    where: { id: auctionState.currentBidderTeamId! },
                    data: {
                        remainingBudget: { decrement: auctionState.currentPrice },
                        totalPlayers: { increment: 1 }
                    }
                }),
                prisma.auctionState.update({
                    where: { seasonId: seasonIdNum },
                    data: {
                        status: 'READY',
                        currentPlayerId: null,
                        currentPrice: 0,
                        currentBidderTeamId: null,
                        timerEndsAt: null
                    }
                }),
                prisma.auctionLog.create({
                    data: {
                        seasonId: seasonIdNum,
                        eventType: 'player_sold',
                        userId: req.user?.userId || null,
                        teamId: auctionState.currentBidderTeamId,
                        playerId: seasonPlayer.playerId,
                        amount: auctionState.currentPrice,
                        details: JSON.stringify({
                            soldPrice: auctionState.currentPrice,
                            teamName: winningTeam.name,
                            manual: explicitSold
                        })
                    }
                })
            ]);

            if (ioInstance) {
                const p = seasonPlayer.player as any;
                ioInstance.emit('AUCTION_COMPLETE', {
                    seasonId: seasonIdNum,
                    seasonPlayerId: seasonPlayer.id,
                    status: 'SOLD',
                    teamId: auctionState.currentBidderTeamId,
                    teamName: winningTeam.name,
                    soldPrice: auctionState.currentPrice,
                    playerName: p?.name || 'Player',
                    playerImageUrl: p?.imageUrl || null,
                    category: p?.category || null
                });
            }

            return res.json({
                message: 'Player sold successfully',
                seasonPlayerId: seasonPlayer.id,
                teamId: auctionState.currentBidderTeamId,
                soldPrice: auctionState.currentPrice
            });
        }

        // --- Auto / no qualifying sale → unsold ---
        await prisma.$transaction([
            prisma.seasonPlayer.update({
                where: { id: seasonPlayer.id },
                data: {
                    status: 'UNSOLD',
                    teamId: null,
                    soldPrice: null,
                    soldType: null,
                    soldAt: null
                }
            }),
            prisma.auctionState.update({
                where: { seasonId: seasonIdNum },
                data: {
                    status: 'READY',
                    currentPlayerId: null,
                    currentPrice: 0,
                    currentBidderTeamId: null,
                    timerEndsAt: null
                }
            }),
            prisma.auctionLog.create({
                data: {
                    seasonId: seasonIdNum,
                    eventType: 'player_unsold',
                    userId: req.user?.userId || null,
                    playerId: seasonPlayer.playerId,
                    details: JSON.stringify({
                        reason: explicitSold ? 'Sold request failed checks' : 'No valid bids (timer or auto)'
                    })
                }
            })
        ]);

        if (ioInstance) {
            ioInstance.emit('AUCTION_COMPLETE', {
                seasonId: seasonIdNum,
                seasonPlayerId: seasonPlayer.id,
                status: 'UNSOLD'
            });
        }

        return res.json({
            message: 'Player marked as unsold',
            seasonPlayerId: seasonPlayer.id
        });
    } catch (error) {
        console.error('Error completing auction:', error);
        res.status(500).json({ error: 'Failed to complete auction' });
    }
};

export const undoLastBid = async (req: AuthRequest, res: Response) => {
    try {
        const { seasonId } = req.params;
        const seasonIdNum = parseInt(seasonId);

        const auctionState = await prisma.auctionState.findUnique({ 
            where: { seasonId: seasonIdNum } 
        });
        
        if (!auctionState || (auctionState.status !== 'LIVE' && auctionState.status !== 'PAUSED') || !auctionState.currentPlayerId) {
            return res.status(400).json({ error: 'No active auction to undo bid' });
        }

        // Get season player to get playerId
        const seasonPlayer = await prisma.seasonPlayer.findUnique({
            where: { id: auctionState.currentPlayerId },
            select: { playerId: true }
        });

        if (!seasonPlayer) {
            return res.status(404).json({ error: 'Season player not found' });
        }

        // Get the last bid for current player
        const lastBid = await prisma.bidLog.findFirst({
            where: { 
                seasonId: seasonIdNum,
                playerId: seasonPlayer.playerId,
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
                seasonId: seasonIdNum,
                playerId: seasonPlayer.playerId,
                isUndone: false,
                id: { not: lastBid.id }
            },
            orderBy: { timestamp: 'desc' }
        });

        // Get base price from player
        const player = await prisma.player.findUnique({
            where: { id: seasonPlayer.playerId },
            select: { basePrice: true }
        });

        const previousPrice = previousBid ? previousBid.amount : (player?.basePrice || 0);

        // Update auction state to previous bid
        await prisma.$transaction([
            prisma.auctionState.update({
                where: { seasonId: seasonIdNum },
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
                    seasonId: seasonIdNum,
                    eventType: 'bid_undone',
                    userId: req.user?.userId || null,
                    teamId: lastBid.teamId,
                    playerId: seasonPlayer.playerId,
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
                seasonId: seasonIdNum,
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
    try {
        const { seasonId } = req.params;
        const { seasonPlayerId } = req.body;
        const seasonIdNum = parseInt(seasonId);

        const seasonPlayer = await prisma.seasonPlayer.findUnique({
            where: { id: seasonPlayerId },
            include: {
                player: true,
                team: true
            }
        });

        if (!seasonPlayer) {
            return res.status(404).json({ error: 'Season player not found' });
        }

        if (seasonPlayer.seasonId !== seasonIdNum) {
            return res.status(400).json({ error: 'Season player does not belong to this season' });
        }

        if (seasonPlayer.status !== 'SOLD' && seasonPlayer.status !== 'UNSOLD') {
            return res.status(400).json({ error: 'Player is already active' });
        }

        // Get the team if player was sold
        let previousTeam = seasonPlayer.team;

        await prisma.$transaction(async (tx) => {
            // Revert team changes if player was sold
            if (seasonPlayer.status === 'SOLD' && previousTeam && seasonPlayer.soldPrice) {
                await tx.team.update({
                    where: { id: previousTeam.id },
                    data: {
                        remainingBudget: { increment: seasonPlayer.soldPrice },
                        totalPlayers: { decrement: 1 }
                    }
                });
            }

            // Mark season player as ACTIVE
            await tx.seasonPlayer.update({
                where: { id: seasonPlayerId },
                data: {
                    status: 'ACTIVE',
                    teamId: null,
                    soldPrice: null,
                    soldType: null,
                    soldAt: null
                }
            });

            // Audit log
            await tx.auctionLog.create({
                data: {
                    seasonId: seasonIdNum,
                    eventType: 'player_reopened',
                    userId: req.user?.userId || null,
                    playerId: seasonPlayer.playerId,
                    teamId: previousTeam?.id || null,
                    details: JSON.stringify({
                        previousStatus: seasonPlayer.status,
                        previousSoldPrice: seasonPlayer.soldPrice,
                        previousTeam: previousTeam?.name || null
                    })
                }
            });
        });

        res.json({ 
            message: 'Player reopened for auction',
            seasonPlayerId: seasonPlayerId
        });
    } catch (error) {
        console.error('Error reopening player:', error);
        res.status(500).json({ error: 'Failed to reopen player' });
    }
};
