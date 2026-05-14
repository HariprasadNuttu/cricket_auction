import { Server, Socket } from 'socket.io';
import prisma from '../utils/prisma';
import { AUCTION_BID_TIMER_MS } from '../config/auction';
import { maxPlayersForSeason, minPlayersForSeason } from '../utils/seasonPlayerLimits';

// Rate limiting: Track last bid time per team
const lastBidTime = new Map<number, number>();
const RATE_LIMIT_MS = 500; // Minimum 500ms between bids from same team

// Duplicate bid prevention: Track recent bids
const recentBids = new Map<string, number>();
const DUPLICATE_WINDOW_MS = 2000; // 2 seconds window

// Helper function to get minimum bid increment based on current price
function getMinimumIncrement(currentPrice: number): number {
    if (currentPrice < 100) return 5;
    if (currentPrice < 500) return 10;
    if (currentPrice < 1000) return 20;
    if (currentPrice < 5000) return 50;
    return 100;
}

export const registerAuctionHandlers = (io: Server, socket: Socket) => {
    const onPlaceBid = async (payload: { 
        seasonId: number;
        amount: number; 
        teamId: number; 
        isAdminBid?: boolean; 
        isAuctioneerBid?: boolean;
        adminUserId?: number;
        ownerUserId?: number;
    }) => {
        try {
            const { seasonId, amount, teamId } = payload;

            if (!seasonId) {
                socket.emit('ERROR', { message: 'Season ID is required' });
                return;
            }

            // 1. Validate Auction State (for this season)
            const auctionState = await prisma.auctionState.findUnique({ 
                where: { seasonId: seasonId } 
            });

            if (!auctionState || auctionState.status !== 'LIVE') {
                socket.emit('ERROR', { 
                    message: auctionState?.status === 'PAUSED' 
                        ? 'Auction is paused. Please wait for admin to resume.' 
                        : 'Auction not live' 
                });
                return;
            }

            const { currentPrice, timerEndsAt } = auctionState;
            const currentTime = new Date();
            
            // Server-side timer validation (critical security check)
            if (timerEndsAt && currentTime > timerEndsAt) {
                socket.emit('ERROR', { message: 'Timer finished. Auction has ended.' });
                return;
            }
            
            // Additional validation: ensure timer hasn't expired during processing
            const timeRemaining = timerEndsAt ? timerEndsAt.getTime() - currentTime.getTime() : 0;
            if (timeRemaining <= 0) {
                socket.emit('ERROR', { message: 'Timer expired. Auction has ended.' });
                return;
            }

            // 2. Validate Bid Amount
            if (amount <= currentPrice) {
                socket.emit('ERROR', { 
                    message: `Bid must be higher than current price (${currentPrice})` 
                });
                return;
            }

            // 2a. Validate Bid Increment (minimum increment rules)
            const minIncrement = getMinimumIncrement(currentPrice);
            const actualIncrement = amount - currentPrice;
            if (actualIncrement < minIncrement) {
                socket.emit('ERROR', { 
                    message: `Minimum bid increment is ${minIncrement}. Your bid must be at least ${currentPrice + minIncrement}` 
                });
                return;
            }

            // 3. Validate Team Budget
            const team = await prisma.team.findUnique({ 
                where: { id: teamId },
                include: {
                    season: true
                }
            });

            if (!team) {
                socket.emit('ERROR', { message: 'Team not found' });
                return;
            }

            // Verify team belongs to this season
            if (team.seasonId !== seasonId) {
                socket.emit('ERROR', { message: 'Team does not belong to this season' });
                return;
            }

            const maxPlayers = maxPlayersForSeason(team.season);
            if (team.totalPlayers >= maxPlayers) {
                socket.emit('ERROR', {
                    message: `Team squad is full (${maxPlayers} players). Cannot place bids.`
                });
                return;
            }

            // Budget validation
            if (team.remainingBudget < amount) {
                socket.emit('ERROR', { 
                    message: `Insufficient budget. Remaining: ${team.remainingBudget}, Required: ${amount}` 
                });
                return;
            }

            // Reserve budget for remaining slots only until minimum squad size is reached
            const minPlayers = minPlayersForSeason(team.season);
            const remainingSlots = maxPlayers - team.totalPlayers;
            if (
                remainingSlots > 0 &&
                team.totalPlayers < minPlayers
            ) {
                const minimumRequiredBudget = remainingSlots * 20;
                if (team.remainingBudget - amount < minimumRequiredBudget) {
                    socket.emit('ERROR', {
                        message: `Cannot bid: Team needs at least ${minimumRequiredBudget} for remaining ${remainingSlots} player slot(s)`
                    });
                    return;
                }
            }

            // 3b. Rate Limiting: Prevent spam bidding
            const lastBid = lastBidTime.get(teamId);
            const now = Date.now();
            if (lastBid && (now - lastBid) < RATE_LIMIT_MS) {
                socket.emit('ERROR', { 
                    message: `Rate limit: Please wait ${Math.ceil((RATE_LIMIT_MS - (now - lastBid)) / 1000)} second(s) before bidding again` 
                });
                return;
            }

            // 3c. Duplicate Bid Prevention
            const bidKey = `${seasonId}-${teamId}-${amount}-${auctionState.currentPlayerId}`;
            const lastDuplicateBid = recentBids.get(bidKey);
            if (lastDuplicateBid && (now - lastDuplicateBid) < DUPLICATE_WINDOW_MS) {
                socket.emit('ERROR', { 
                    message: 'Duplicate bid detected. Please wait before placing the same bid again.' 
                });
                return;
            }

            // Update rate limiting and duplicate prevention
            lastBidTime.set(teamId, now);
            recentBids.set(bidKey, now);
            
            // Clean up old entries (prevent memory leak)
            if (recentBids.size > 1000) {
                const cutoff = now - DUPLICATE_WINDOW_MS;
                for (const [key, timestamp] of recentBids.entries()) {
                    if (timestamp < cutoff) {
                        recentBids.delete(key);
                    }
                }
            }

            // 4. Get season player to get playerId
            const seasonPlayer = await prisma.seasonPlayer.findUnique({
                where: { id: auctionState.currentPlayerId! },
                select: { playerId: true }
            });

            if (!seasonPlayer) {
                socket.emit('ERROR', { message: 'Current player not found' });
                return;
            }

            // 5. Determine userId for bid log
            let userIdForLog = team.ownerId;
            
            // Check if it's an owner bid
            if (payload.ownerUserId) {
                const ownerUser = await prisma.user.findUnique({ 
                    where: { id: payload.ownerUserId } 
                });
                // Verify the owner actually owns this team
                if (ownerUser && ownerUser.role === 'OWNER' && ownerUser.id === team.ownerId) {
                    userIdForLog = payload.ownerUserId;
                }
            }
            // Check if it's an admin or auctioneer bid (only if not owner bid)
            else if ((payload.isAdminBid || payload.isAuctioneerBid) && payload.adminUserId) {
                const user = await prisma.user.findUnique({ 
                    where: { id: payload.adminUserId } 
                });
                if (user && (user.role === 'ADMIN' || user.role === 'AUCTIONEER')) {
                    if (user.role === 'AUCTIONEER') {
                        const auctionRoom = await prisma.auctionRoom.findUnique({
                            where: { seasonId }
                        });
                        if (auctionRoom && auctionRoom.auctioneerId === user.id) {
                            userIdForLog = payload.adminUserId;
                        }
                    } else {
                        userIdForLog = payload.adminUserId;
                    }
                }
            }

            // 6. Atomic Bid Update with Race Condition Protection
            const newTimerEndsAt = new Date(currentTime.getTime() + AUCTION_BID_TIMER_MS);
            
            // Get current version for optimistic locking
            const currentState = await prisma.auctionState.findUnique({ 
                where: { seasonId: seasonId },
                select: { version: true, currentPrice: true }
            });

            if (!currentState) {
                socket.emit('ERROR', { message: 'Auction state not found' });
                return;
            }

            // Double-check price hasn't changed (race condition protection)
            if (amount <= currentState.currentPrice) {
                socket.emit('ERROR', { 
                    message: `Bid amount ${amount} must be higher than current price ${currentState.currentPrice}` 
                });
                return;
            }

            // Atomic update with version check
            const updatedState = await prisma.auctionState.updateMany({
                where: { 
                    seasonId: seasonId,
                    version: currentState.version // Only update if version matches
                },
                data: {
                    currentPrice: amount,
                    currentBidderTeamId: teamId,
                    timerEndsAt: newTimerEndsAt,
                    version: { increment: 1 }
                }
            });

            // If no rows updated, version mismatch occurred (race condition detected)
            if (updatedState.count === 0) {
                socket.emit('ERROR', { 
                    message: 'Bid failed: Another bid was placed simultaneously. Please try again.' 
                });
                return;
            }

            await prisma.$transaction([
                // Log bid - userId will be admin's ID if admin bid, otherwise team owner's ID
                prisma.bidLog.create({
                    data: {
                        seasonId: seasonId,
                        amount: amount,
                        teamId: teamId,
                        playerId: seasonPlayer.playerId,
                        userId: userIdForLog
                    }
                }),
                // Audit log
                prisma.auctionLog.create({
                    data: {
                        seasonId: seasonId,
                        eventType: 'bid_placed',
                        userId: userIdForLog,
                        teamId: teamId,
                        playerId: seasonPlayer.playerId,
                        amount: amount,
                        details: JSON.stringify({
                            previousPrice: currentState.currentPrice,
                            newPrice: amount,
                            isAdminBid: payload.isAdminBid || false
                        })
                    }
                })
            ]);

            // 7. Get updated bid history for current player
            const bidHistory = await prisma.bidLog.findMany({
                where: { 
                    seasonId: seasonId,
                    playerId: seasonPlayer.playerId 
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

            // 8. Broadcast Update (scoped to season)
            io.emit('AUCTION_UPDATE', {
                seasonId: seasonId,
                currentPrice: amount,
                currentBidderTeamId: teamId,
                timerEndsAt: newTimerEndsAt,
                status: 'LIVE',
                bidHistory: bidHistory
            });

            console.log(`Bid placed: ${amount} by team ${team.name} in season ${seasonId}${payload.isAdminBid ? ' (via admin)' : ''}`);

        } catch (error: any) {
            console.error('Bid placement error:', error);
            socket.emit('ERROR', { message: 'Bid failed' });
        }
    };

    socket.on('PLACE_BID', onPlaceBid);
};
