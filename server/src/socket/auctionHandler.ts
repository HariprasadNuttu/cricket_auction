import { Server, Socket } from 'socket.io';
import prisma from '../utils/prisma';

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
        amount: number; 
        teamId: number; 
        isAdminBid?: boolean; 
        adminUserId?: number;
        ownerUserId?: number;
    }) => {
        try {
            // 1. Validate Auction State
            const auctionState = await prisma.auctionState.findUnique({ where: { id: 1 } });
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
            if (payload.amount <= currentPrice) {
                socket.emit('ERROR', { 
                    message: `Bid must be higher than current price (${currentPrice})` 
                });
                return;
            }

            // 2a. Validate Bid Increment (minimum increment rules)
            const minIncrement = getMinimumIncrement(currentPrice);
            const actualIncrement = payload.amount - currentPrice;
            if (actualIncrement < minIncrement) {
                socket.emit('ERROR', { 
                    message: `Minimum bid increment is ${minIncrement}. Your bid must be at least ${currentPrice + minIncrement}` 
                });
                return;
            }

            // 3. Validate Team Budget
            const team = await prisma.team.findUnique({ where: { id: payload.teamId } });
            if (!team) {
                socket.emit('ERROR', { message: 'Team not found' });
                return;
            }
            
            // Budget validation
            if (team.remainingBudget < payload.amount) {
                socket.emit('ERROR', { 
                    message: `Insufficient budget. Remaining: ${team.remainingBudget}, Required: ${payload.amount}` 
                });
                return;
            }

            // 3a. Validate minimum slot budget (prevent teams from getting stuck)
            const remainingSlots = 15 - team.totalPlayers;
            const minimumRequiredBudget = remainingSlots * 20; // Base price per player
            if (team.remainingBudget - payload.amount < minimumRequiredBudget && remainingSlots > 0) {
                socket.emit('ERROR', { 
                    message: `Cannot bid: Team needs at least ${minimumRequiredBudget} for remaining ${remainingSlots} player slot(s)` 
                });
                return;
            }

            // 3b. Rate Limiting: Prevent spam bidding
            const lastBid = lastBidTime.get(payload.teamId);
            const now = Date.now();
            if (lastBid && (now - lastBid) < RATE_LIMIT_MS) {
                socket.emit('ERROR', { 
                    message: `Rate limit: Please wait ${Math.ceil((RATE_LIMIT_MS - (now - lastBid)) / 1000)} second(s) before bidding again` 
                });
                return;
            }

            // 3c. Duplicate Bid Prevention
            const bidKey = `${payload.teamId}-${payload.amount}-${auctionState.currentPlayerId}`;
            const lastDuplicateBid = recentBids.get(bidKey);
            if (lastDuplicateBid && (now - lastDuplicateBid) < DUPLICATE_WINDOW_MS) {
                socket.emit('ERROR', { 
                    message: 'Duplicate bid detected. Please wait before placing the same bid again.' 
                });
                return;
            }

            // Update rate limiting and duplicate prevention
            lastBidTime.set(payload.teamId, now);
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

            // 4. Determine userId for bid log
            // Priority: ownerUserId (if owner bid) > adminUserId (if admin bid) > team ownerId
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
            // Check if it's an admin bid (only if not owner bid)
            else if (payload.isAdminBid && payload.adminUserId) {
                const adminUser = await prisma.user.findUnique({ 
                    where: { id: payload.adminUserId } 
                });
                if (adminUser && adminUser.role === 'ADMIN') {
                    userIdForLog = payload.adminUserId;
                }
            }

            // 5. Atomic Bid Update with Race Condition Protection
            // Use optimistic locking with version check to prevent race conditions
            const newTimerEndsAt = new Date(currentTime.getTime() + 60 * 1000); // Reset to 1 minute
            
            // Get current version for optimistic locking
            const currentState = await prisma.auctionState.findUnique({ 
                where: { id: 1 },
                select: { version: true, currentPrice: true }
            });

            if (!currentState) {
                socket.emit('ERROR', { message: 'Auction state not found' });
                return;
            }

            // Double-check price hasn't changed (race condition protection)
            if (payload.amount <= currentState.currentPrice) {
                socket.emit('ERROR', { 
                    message: `Bid amount ${payload.amount} must be higher than current price ${currentState.currentPrice}` 
                });
                return;
            }

            // Atomic update with version check
            const updatedState = await prisma.auctionState.updateMany({
                where: { 
                    id: 1,
                    version: currentState.version // Only update if version matches
                },
                data: {
                    currentPrice: payload.amount,
                    currentBidderTeamId: payload.teamId,
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
                        amount: payload.amount,
                        teamId: payload.teamId,
                        playerId: auctionState.currentPlayerId!,
                        userId: userIdForLog
                    }
                }),
                // Audit log
                prisma.auctionLog.create({
                    data: {
                        eventType: 'bid_placed',
                        userId: userIdForLog,
                        teamId: payload.teamId,
                        playerId: auctionState.currentPlayerId!,
                        amount: payload.amount,
                        details: JSON.stringify({
                            previousPrice: currentState.currentPrice,
                            newPrice: payload.amount,
                            isAdminBid: payload.isAdminBid || false
                        })
                    }
                })
            ]);

            // 6. Get updated bid history for current player
            const bidHistory = await prisma.bidLog.findMany({
                where: { playerId: auctionState.currentPlayerId! },
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

            // 7. Broadcast Update
            io.emit('AUCTION_UPDATE', {
                currentPrice: payload.amount,
                currentBidderTeamId: payload.teamId,
                timerEndsAt: newTimerEndsAt,
                status: 'LIVE',
                bidHistory: bidHistory
            });

            console.log(`Bid placed: ${payload.amount} by team ${team.name}${payload.isAdminBid ? ' (via admin)' : ''}`);

        } catch (error: any) {
            console.error('Bid placement error:', error);
            socket.emit('ERROR', { message: 'Bid failed' });
        }
    };

    socket.on('PLACE_BID', onPlaceBid);
};
