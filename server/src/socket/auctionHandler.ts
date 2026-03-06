import { Server, Socket } from 'socket.io';
import prisma from '../utils/prisma';

export const registerAuctionHandlers = (io: Server, socket: Socket) => {
    const onPlaceBid = async (payload: { 
        amount: number; 
        teamId: number; 
        isAdminBid?: boolean; 
        adminUserId?: number 
    }) => {
        try {
            // 1. Validate Auction State
            const auctionState = await prisma.auctionState.findUnique({ where: { id: 1 } });
            if (!auctionState || auctionState.status !== 'LIVE') {
                socket.emit('ERROR', { message: 'Auction not live' });
                return;
            }

            const { currentPrice, timerEndsAt } = auctionState;
            const now = new Date();
            if (timerEndsAt && now > timerEndsAt) {
                socket.emit('ERROR', { message: 'Timer finished' });
                return;
            }

            // 2. Validate Bid Amount
            if (payload.amount <= currentPrice) {
                socket.emit('ERROR', { message: 'Bid must be higher than current price' });
                return;
            }

            // 3. Validate Team Budget
            const team = await prisma.team.findUnique({ where: { id: payload.teamId } });
            if (!team) {
                socket.emit('ERROR', { message: 'Team not found' });
                return;
            }
            if (team.remainingBudget < payload.amount) {
                socket.emit('ERROR', { message: 'Insufficient budget' });
                return;
            }

            // 4. Determine userId for bid log
            // If it's an admin bid, use admin's userId, otherwise use team owner's userId
            let userIdForLog = team.ownerId;
            if (payload.isAdminBid && payload.adminUserId) {
                // Verify admin user exists and is actually an admin
                const adminUser = await prisma.user.findUnique({ 
                    where: { id: payload.adminUserId } 
                });
                if (adminUser && adminUser.role === 'ADMIN') {
                    userIdForLog = payload.adminUserId;
                }
            }

            // 5. Update Auction State
            const newTimerEndsAt = new Date(now.getTime() + 60 * 1000); // Reset to 1 minute

            await prisma.$transaction([
                prisma.auctionState.update({
                    where: { id: 1 },
                    data: {
                        currentPrice: payload.amount,
                        currentBidderTeamId: payload.teamId,
                        timerEndsAt: newTimerEndsAt,
                        version: { increment: 1 } // Optimistic locking pattern
                    }
                }),
                // Log bid - userId will be admin's ID if admin bid, otherwise team owner's ID
                prisma.bidLog.create({
                    data: {
                        amount: payload.amount,
                        teamId: payload.teamId,
                        playerId: auctionState.currentPlayerId!,
                        userId: userIdForLog
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
