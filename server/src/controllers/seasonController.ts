import { Request, Response } from 'express';
import prisma from '../utils/prisma';

interface AuthRequest extends Request {
    user?: any;
}

export const createSeason = async (req: AuthRequest, res: Response) => {
    try {
        const { groupId } = req.params;
        const { name, year } = req.body;
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

        const season = await prisma.season.create({
            data: {
                groupId: groupIdNum,
                name,
                year: year ? parseInt(year) : null,
                status: 'DRAFT'
            },
            include: {
                group: {
                    select: { id: true, name: true }
                }
            }
        });

        res.status(201).json(season);
    } catch (error: any) {
        console.error('Error creating season:', error);
        res.status(500).json({ error: 'Failed to create season' });
    }
};

export const getSeasonsByGroup = async (req: AuthRequest, res: Response) => {
    try {
        const { groupId } = req.params;
        const groupIdNum = parseInt(groupId);

        const seasons = await prisma.season.findMany({
            where: { groupId: groupIdNum },
            include: {
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
        const { name, year, status } = req.body;
        const seasonId = parseInt(id);

        const season = await prisma.season.update({
            where: { id: seasonId },
            data: {
                name,
                year: year ? parseInt(year) : undefined,
                status
            }
        });

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
                seasonPlayers: true
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
                status: 'DRAFT'
            }
        });

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
