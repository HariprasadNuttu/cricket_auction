import { Server, Socket } from 'socket.io';
import prisma from '../utils/prisma';

export const registerAuctionHandlers = (io: Server, socket: Socket) => {
    const onPlaceBid = async (payload: { amount: number; teamId: number }) => {
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

            // 4. Update Auction State
            const newTimerEndsAt = new Date(now.getTime() + 15 * 1000); // Reset to 15s

            await prisma.$transaction([
                prisma.auctionState.update({
                    where: { id: 1 },
                    data: {
                        currentPrice: payload.amount,
                        currentBidderTeamId: payload.teamId,
                        // currentBidderId: userId // If we had userId context here
                        timerEndsAt: newTimerEndsAt,
                        version: { increment: 1 } // Optimistic locking pattern
                    }
                }),
                // Log bid
                prisma.bidLog.create({
                    data: {
                        amount: payload.amount,
                        teamId: payload.teamId,
                        playerId: auctionState.currentPlayerId!,
                        userId: team.ownerId // Assuming owner placed it
                    }
                })
            ]);

            // 5. Broadcast Update
            io.emit('AUCTION_UPDATE', {
                currentPrice: payload.amount,
                currentBidderTeamId: payload.teamId,
                timerEndsAt: newTimerEndsAt
            });

        } catch (error: any) {
            console.error(error);
            socket.emit('ERROR', { message: 'Bid failed' });
        }
    };

    socket.on('PLACE_BID', onPlaceBid);
};
