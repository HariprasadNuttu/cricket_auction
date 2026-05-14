import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { clampSeasonPlayerLimits } from '../utils/seasonPlayerLimits';

interface AuthRequest extends Request {
    user?: any;
}

export const createSeason = async (req: AuthRequest, res: Response) => {
    try {
        const { groupId } = req.params;
        const { name, year, budget, auctioneerId, minPlayersPerTeam, maxPlayersPerTeam } = req.body;
        const groupIdNum = parseInt(groupId);

        if (!name) {
            return res.status(400).json({ error: 'Season name is required' });
        }

        // Verify group exists
        const group = await prisma.group.findUnique({
            where: { id: groupIdNum }
        });

        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        const limits = clampSeasonPlayerLimits(minPlayersPerTeam, maxPlayersPerTeam);
        if ('error' in limits) {
            return res.status(400).json({ error: limits.error });
        }

        const auctioneerIdNum = auctioneerId != null && auctioneerId !== '' ? parseInt(auctioneerId) : null;
        if (auctioneerIdNum) {
            const auctioneer = await prisma.user.findUnique({ where: { id: auctioneerIdNum } });
            if (!auctioneer || auctioneer.role !== 'AUCTIONEER') {
                return res.status(400).json({ error: 'Selected user must have Auctioneer role' });
            }
        }

        const season = await prisma.season.create({
            data: {
                groupId: groupIdNum,
                name,
                year: year != null ? parseInt(year) : null,
                budget: budget != null ? parseInt(budget) : null,
                minPlayersPerTeam: limits.minPlayersPerTeam,
                maxPlayersPerTeam: limits.maxPlayersPerTeam,
                auctioneerId: auctioneerIdNum,
                status: 'DRAFT'
            },
            include: {
                group: {
                    select: { id: true, name: true }
                },
                auctioneer: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        // Create AuctionRoom when auctioneer is assigned
        if (auctioneerIdNum) {
            await prisma.auctionRoom.upsert({
                where: { seasonId: season.id },
                update: { auctioneerId: auctioneerIdNum },
                create: {
                    seasonId: season.id,
                    auctioneerId: auctioneerIdNum,
                    name: `${season.name} - ${group.name}`,
                    status: 'CREATED'
                }
            });
        }

        res.status(201).json(season);
    } catch (error: any) {
        console.error('Error creating season:', error);
        const message = error?.message || 'Failed to create season';
        res.status(500).json({ error: 'Failed to create season', details: message });
    }
};

export const getSeasonsByGroup = async (req: AuthRequest, res: Response) => {
    try {
        const { groupId } = req.params;
        const groupIdNum = parseInt(groupId);

        const seasons = await prisma.season.findMany({
            where: { groupId: groupIdNum },
            include: {
                auctioneer: {
                    select: { id: true, name: true, email: true }
                },
                _count: {
                    select: {
                        teams: true,
                        seasonPlayers: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(seasons);
    } catch (error) {
        console.error('Error fetching seasons:', error);
        res.status(500).json({ error: 'Failed to fetch seasons' });
    }
};

export const getSeasonById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const seasonId = parseInt(id);

        const season = await prisma.season.findUnique({
            where: { id: seasonId },
            include: {
                group: {
                    select: { id: true, name: true }
                },
                auctioneer: {
                    select: { id: true, name: true, email: true }
                },
                teams: {
                    include: {
                        owner: {
                            select: { id: true, name: true, email: true }
                        }
                    }
                },
                seasonPlayers: {
                    include: {
                        player: true,
                        team: {
                            select: { id: true, name: true }
                        }
                    }
                },
                auctionState: true,
                _count: {
                    select: {
                        teams: true,
                        seasonPlayers: true
                    }
                }
            }
        });

        if (!season) {
            return res.status(404).json({ error: 'Season not found' });
        }

        res.json(season);
    } catch (error) {
        console.error('Error fetching season:', error);
        res.status(500).json({ error: 'Failed to fetch season' });
    }
};

export const updateSeason = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, year, budget, status, auctioneerId, minPlayersPerTeam, maxPlayersPerTeam } = req.body;
        const seasonId = parseInt(id);

        const updateData: Record<string, any> = {};
        if (name !== undefined) updateData.name = name;
        if (year !== undefined) updateData.year = year != null ? parseInt(year) : null;
        if (budget !== undefined) updateData.budget = budget != null ? parseInt(budget) : null;
        if (status !== undefined) updateData.status = status;
        if (auctioneerId !== undefined) {
            if (auctioneerId === null || auctioneerId === '') {
                updateData.auctioneerId = null;
            } else {
                const auctioneerIdNum = parseInt(auctioneerId);
                const auctioneer = await prisma.user.findUnique({ where: { id: auctioneerIdNum } });
                if (!auctioneer || auctioneer.role !== 'AUCTIONEER') {
                    return res.status(400).json({ error: 'Selected user must have Auctioneer role' });
                }
                updateData.auctioneerId = auctioneerIdNum;
            }
        }

        if (minPlayersPerTeam !== undefined || maxPlayersPerTeam !== undefined) {
            const existing = await prisma.season.findUnique({
                where: { id: seasonId },
                select: { minPlayersPerTeam: true, maxPlayersPerTeam: true }
            });
            if (!existing) {
                return res.status(404).json({ error: 'Season not found' });
            }
            const limits = clampSeasonPlayerLimits(
                minPlayersPerTeam !== undefined ? minPlayersPerTeam : existing.minPlayersPerTeam,
                maxPlayersPerTeam !== undefined ? maxPlayersPerTeam : existing.maxPlayersPerTeam
            );
            if ('error' in limits) {
                return res.status(400).json({ error: limits.error });
            }
            updateData.minPlayersPerTeam = limits.minPlayersPerTeam;
            updateData.maxPlayersPerTeam = limits.maxPlayersPerTeam;
        }

        const season = await prisma.season.update({
            where: { id: seasonId },
            data: updateData,
            include: {
                group: { select: { id: true, name: true } },
                auctioneer: { select: { id: true, name: true, email: true } }
            }
        });

        // Sync AuctionRoom when auctioneer is assigned or cleared
        if (auctioneerId !== undefined) {
            if (updateData.auctioneerId) {
                const group = await prisma.group.findUnique({ where: { id: season.groupId } });
                await prisma.auctionRoom.upsert({
                    where: { seasonId: seasonId },
                    update: { auctioneerId: updateData.auctioneerId },
                    create: {
                        seasonId: seasonId,
                        auctioneerId: updateData.auctioneerId,
                        name: `${season.name} - ${group?.name || 'Auction'}`,
                        status: 'CREATED'
                    }
                });
            } else {
                await prisma.auctionRoom.deleteMany({ where: { seasonId: seasonId } });
            }
        }

        res.json(season);
    } catch (error: any) {
        console.error('Error updating season:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Season not found' });
        }
        res.status(500).json({ error: 'Failed to update season' });
    }
};

export const deleteSeason = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const seasonId = parseInt(id);

        await prisma.season.delete({
            where: { id: seasonId }
        });

        res.json({ message: 'Season deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting season:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Season not found' });
        }
        res.status(500).json({ error: 'Failed to delete season' });
    }
};

export const cloneSeason = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const sourceSeasonId = parseInt(id);

        if (!name) {
            return res.status(400).json({ error: 'New season name is required' });
        }

        // Get source season with all data
        const sourceSeason = await prisma.season.findUnique({
            where: { id: sourceSeasonId },
            include: {
                group: true,
                teams: true,
                seasonPlayers: true,
                seasonOwners: true
            }
        });

        if (!sourceSeason) {
            return res.status(404).json({ error: 'Source season not found' });
        }

        // Create new season
        const newSeason = await prisma.season.create({
            data: {
                groupId: sourceSeason.groupId,
                name,
                year: sourceSeason.year ? sourceSeason.year + 1 : null,
                budget: sourceSeason.budget,
                minPlayersPerTeam: sourceSeason.minPlayersPerTeam,
                maxPlayersPerTeam: sourceSeason.maxPlayersPerTeam,
                status: 'DRAFT'
            }
        });

        // Clone season owners (same owners participate in cloned season)
        for (const so of sourceSeason.seasonOwners) {
            await prisma.seasonOwner.create({
                data: {
                    seasonId: newSeason.id,
                    userId: so.userId
                }
            });
        }

        // Clone teams
        const teamMap = new Map<number, number>(); // old team id -> new team id
        for (const team of sourceSeason.teams) {
            const newTeam = await prisma.team.create({
                data: {
                    seasonId: newSeason.id,
                    name: team.name,
                    ownerId: team.ownerId,
                    totalBudget: team.totalBudget,
                    remainingBudget: team.totalBudget, // Reset budget
                    totalPlayers: 0 // Reset player count
                }
            });
            teamMap.set(team.id, newTeam.id);
        }

        // Clone season players (reset status and sold price)
        for (const seasonPlayer of sourceSeason.seasonPlayers) {
            await prisma.seasonPlayer.create({
                data: {
                    seasonId: newSeason.id,
                    playerId: seasonPlayer.playerId,
                    status: 'ACTIVE',
                    soldPrice: null,
                    teamId: null
                }
            });
        }

        res.status(201).json({
            message: 'Season cloned successfully',
            season: newSeason
        });
    } catch (error) {
        console.error('Error cloning season:', error);
        res.status(500).json({ error: 'Failed to clone season' });
    }
};
