import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { parse } from 'csv-parse';
import multer from 'multer';

interface AuthRequest extends Request {
    user?: any;
}

// Configure multer for file uploads
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export const uploadMiddleware = upload.single('file');

// Direct assign single player to team (accepts seasonPlayerId OR playerId - group-level)
export const directAssignPlayer = async (req: AuthRequest, res: Response) => {
    try {
        const { seasonId } = req.params;
        const { seasonPlayerId, playerId, teamId, amount } = req.body;
        const seasonIdNum = parseInt(seasonId);

        if ((!seasonPlayerId && !playerId) || !teamId || amount === undefined) {
            return res.status(400).json({ 
                error: 'Either seasonPlayerId or playerId, plus teamId and amount are required' 
            });
        }

        const assignAmount = parseInt(amount) || 0;
        const teamIdNum = parseInt(teamId);

        let seasonPlayer;

        if (seasonPlayerId) {
            // Use existing season player
            seasonPlayer = await prisma.seasonPlayer.findUnique({
                where: { id: parseInt(seasonPlayerId) },
                include: {
                    player: true,
                    season: true
                }
            });
        } else if (playerId) {
            // Assign by group player ID - find or create season player
            const season = await prisma.season.findUnique({
                where: { id: seasonIdNum },
                include: { group: true }
            });
            if (!season) {
                return res.status(404).json({ error: 'Season not found' });
            }
            const player = await prisma.player.findUnique({
                where: { id: parseInt(playerId) }
            });
            if (!player || player.groupId !== season.groupId) {
                return res.status(404).json({ error: 'Player not found in this group' });
            }
            // Find or create season player
            seasonPlayer = await prisma.seasonPlayer.findUnique({
                where: {
                    seasonId_playerId: { seasonId: seasonIdNum, playerId: player.id }
                },
                include: { player: true, season: true }
            });
            if (!seasonPlayer) {
                seasonPlayer = await prisma.seasonPlayer.create({
                    data: {
                        seasonId: seasonIdNum,
                        playerId: player.id,
                        status: 'ACTIVE'
                    },
                    include: { player: true, season: true }
                });
            }
        } else {
            return res.status(400).json({ error: 'seasonPlayerId or playerId required' });
        }

        if (!seasonPlayer) {
            return res.status(404).json({ error: 'Season player not found' });
        }

        if (seasonPlayer.seasonId !== seasonIdNum) {
            return res.status(400).json({ error: 'Season player does not belong to this season' });
        }

        // Validate player is available
        if (seasonPlayer.status !== 'ACTIVE') {
            return res.status(400).json({ 
                error: `Player is already ${seasonPlayer.status}. Cannot assign.` 
            });
        }

        // Get team
        const team = await prisma.team.findUnique({
            where: { id: teamIdNum }
        });

        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        if (team.seasonId !== seasonIdNum) {
            return res.status(400).json({ error: 'Team does not belong to this season' });
        }

        // Validate team squad not full (max 15 players)
        if (team.totalPlayers >= 15) {
            return res.status(400).json({ 
                error: 'Team squad is full (15 players). Cannot assign more players.' 
            });
        }

        // Validate budget if amount > 0
        if (assignAmount > 0 && team.remainingBudget < assignAmount) {
            return res.status(400).json({ 
                error: `Insufficient budget. Remaining: ${team.remainingBudget}, Required: ${assignAmount}` 
            });
        }

        // Perform assignment
        await prisma.$transaction(async (tx) => {
            // Update season player
            await tx.seasonPlayer.update({
                where: { id: seasonPlayer.id },
                data: {
                    status: 'SOLD',
                    soldPrice: assignAmount,
                    soldType: 'DIRECT_ASSIGN',
                    soldAt: new Date(),
                    teamId: teamIdNum
                }
            });

            // Update team (budget and player count)
            await tx.team.update({
                where: { id: teamIdNum },
                data: {
                    remainingBudget: assignAmount > 0 ? { decrement: assignAmount } : undefined,
                    totalPlayers: { increment: 1 }
                }
            });

            // Audit log
            await tx.auctionLog.create({
                data: {
                    seasonId: seasonIdNum,
                    eventType: 'player_direct_assign',
                    userId: req.user?.userId || null,
                    teamId: teamIdNum,
                    playerId: seasonPlayer.playerId,
                    amount: assignAmount,
                    details: JSON.stringify({
                        soldType: 'DIRECT_ASSIGN',
                        amount: assignAmount,
                        teamName: team.name,
                        playerName: seasonPlayer.player.name
                    })
                }
            });
        });

        res.json({ 
            message: 'Player assigned successfully',
            seasonPlayerId: seasonPlayer.id,
            teamId: teamIdNum,
            amount: assignAmount
        });
    } catch (error: any) {
        console.error('Error assigning player:', error);
        res.status(500).json({ error: 'Failed to assign player' });
    }
};

// Bulk direct assign via CSV
export const bulkDirectAssign = async (req: AuthRequest, res: Response) => {
    try {
        const { seasonId } = req.params;
        const seasonIdNum = parseInt(seasonId);

        if (!req.file) {
            return res.status(400).json({ error: 'CSV file is required' });
        }

        // Verify season exists
        const season = await prisma.season.findUnique({
            where: { id: seasonIdNum },
            include: {
                teams: true,
                seasonPlayers: {
                    include: {
                        player: true
                    }
                }
            }
        });

        if (!season) {
            return res.status(404).json({ error: 'Season not found' });
        }

        // Parse CSV
        const csvContent = req.file.buffer.toString('utf-8');
        const records = parse(csvContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            bom: true
        }) as unknown as any[];

        const results = {
            success: [] as any[],
            errors: [] as any[]
        };

        for (const record of records) {
            try {
                const { player_name, team_name, price } = record;

                if (!player_name || !team_name) {
                    results.errors.push({
                        row: record,
                        error: 'Missing required fields: player_name, team_name'
                    });
                    continue;
                }

                const assignAmount = parseInt(price) || 0;

                // Find player in season
                const seasonPlayer = season.seasonPlayers.find(
                    sp => sp.player.name.toLowerCase().trim() === player_name.toLowerCase().trim()
                );

                if (!seasonPlayer) {
                    results.errors.push({
                        row: record,
                        error: `Player "${player_name}" not found in season`
                    });
                    continue;
                }

                if (seasonPlayer.status !== 'ACTIVE') {
                    results.errors.push({
                        row: record,
                        error: `Player "${player_name}" is already ${seasonPlayer.status}`
                    });
                    continue;
                }

                // Find team
                const team = season.teams.find(
                    t => t.name.toLowerCase().trim() === team_name.toLowerCase().trim()
                );

                if (!team) {
                    results.errors.push({
                        row: record,
                        error: `Team "${team_name}" not found in season`
                    });
                    continue;
                }

                // Validate squad not full
                if (team.totalPlayers >= 15) {
                    results.errors.push({
                        row: record,
                        error: `Team "${team_name}" squad is full`
                    });
                    continue;
                }

                // Validate budget
                if (assignAmount > 0 && team.remainingBudget < assignAmount) {
                    results.errors.push({
                        row: record,
                        error: `Team "${team_name}" has insufficient budget`
                    });
                    continue;
                }

                // Perform assignment
                await prisma.$transaction(async (tx) => {
                    await tx.seasonPlayer.update({
                        where: { id: seasonPlayer.id },
                        data: {
                            status: 'SOLD',
                            soldPrice: assignAmount,
                            soldType: 'DIRECT_ASSIGN',
                            soldAt: new Date(),
                            teamId: team.id
                        }
                    });

                    await tx.team.update({
                        where: { id: team.id },
                        data: {
                            remainingBudget: assignAmount > 0 ? { decrement: assignAmount } : undefined,
                            totalPlayers: { increment: 1 }
                        }
                    });

                    await tx.auctionLog.create({
                        data: {
                            seasonId: seasonIdNum,
                            eventType: 'player_direct_assign',
                            userId: req.user?.userId || null,
                            teamId: team.id,
                            playerId: seasonPlayer.playerId,
                            amount: assignAmount,
                            details: JSON.stringify({
                                soldType: 'DIRECT_ASSIGN',
                                bulk: true,
                                amount: assignAmount
                            })
                        }
                    });
                });

                results.success.push({
                    player: player_name,
                    team: team_name,
                    amount: assignAmount
                });
            } catch (error: any) {
                results.errors.push({
                    row: record,
                    error: error.message
                });
            }
        }

        res.json({
            message: `Processed ${records.length} assignments`,
            success: results.success.length,
            errors: results.errors.length,
            details: results
        });
    } catch (error: any) {
        console.error('Error bulk assigning players:', error);
        res.status(500).json({ error: 'Failed to bulk assign players' });
    }
};

// Remove direct assignment (revert)
export const removeDirectAssignment = async (req: AuthRequest, res: Response) => {
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

        if (seasonPlayer.status !== 'SOLD' || seasonPlayer.soldType !== 'DIRECT_ASSIGN') {
            return res.status(400).json({ 
                error: 'Player is not directly assigned. Use reopen player instead.' 
            });
        }

        const team = seasonPlayer.team;
        if (!team) {
            return res.status(400).json({ error: 'Team not found' });
        }

        // Revert assignment
        await prisma.$transaction(async (tx) => {
            // Revert team changes
            await tx.team.update({
                where: { id: team.id },
                data: {
                    remainingBudget: seasonPlayer.soldPrice && seasonPlayer.soldPrice > 0 
                        ? { increment: seasonPlayer.soldPrice } 
                        : undefined,
                    totalPlayers: { decrement: 1 }
                }
            });

            // Reset season player
            await tx.seasonPlayer.update({
                where: { id: seasonPlayerId },
                data: {
                    status: 'ACTIVE',
                    soldPrice: null,
                    soldType: null,
                    soldAt: null,
                    teamId: null
                }
            });

            // Audit log
            await tx.auctionLog.create({
                data: {
                    seasonId: seasonIdNum,
                    eventType: 'player_direct_assign_removed',
                    userId: req.user?.userId || null,
                    teamId: team.id,
                    playerId: seasonPlayer.playerId,
                    amount: seasonPlayer.soldPrice,
                    details: JSON.stringify({
                        previousTeam: team.name,
                        previousAmount: seasonPlayer.soldPrice
                    })
                }
            });
        });

        res.json({ 
            message: 'Direct assignment removed successfully',
            seasonPlayerId: seasonPlayerId
        });
    } catch (error: any) {
        console.error('Error removing assignment:', error);
        res.status(500).json({ error: 'Failed to remove assignment' });
    }
};
