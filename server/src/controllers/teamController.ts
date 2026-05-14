import { Request, Response } from 'express';
import prisma from '../utils/prisma';

interface AuthRequest extends Request {
    user?: any;
}

export const getTeamsBySeason = async (req: AuthRequest, res: Response) => {
    try {
        const { seasonId } = req.params;
        const seasonIdNum = parseInt(seasonId);

        const teams = await prisma.team.findMany({
            where: { seasonId: seasonIdNum },
            include: {
                owner: {
                    select: { id: true, name: true, email: true }
                },
                _count: {
                    select: { seasonPlayers: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        res.json(teams);
    } catch (error: any) {
        console.error('Error fetching teams:', error);
        res.status(500).json({ error: 'Failed to fetch teams' });
    }
};

/** Returns team -> player count mapping for a season */
export const getTeamsPlayersMapping = async (req: AuthRequest, res: Response) => {
    try {
        const { seasonId } = req.params;
        const seasonIdNum = parseInt(seasonId);

        const teams = await prisma.team.findMany({
            where: { seasonId: seasonIdNum },
            select: {
                id: true,
                name: true,
                _count: {
                    select: { seasonPlayers: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        const mapping = teams.map((t) => ({
            teamId: t.id,
            teamName: t.name,
            playerCount: t._count.seasonPlayers
        }));

        res.json({ mapping });
    } catch (error: any) {
        console.error('Error fetching teams players mapping:', error);
        res.status(500).json({ error: 'Failed to fetch teams players mapping' });
    }
};

export const createTeam = async (req: AuthRequest, res: Response) => {
    try {
        const { seasonId } = req.params;
        const { name, ownerId, budget } = req.body;
        const seasonIdNum = parseInt(seasonId);

        if (!name) {
            return res.status(400).json({ error: 'Team name is required' });
        }

        // Verify season exists and get default budget
        const season = await prisma.season.findUnique({
            where: { id: seasonIdNum }
        });

        if (!season) {
            return res.status(404).json({ error: 'Season not found' });
        }

        // Use provided budget, or season's default budget, or 2000
        const teamBudget = budget != null ? parseInt(budget) : (season.budget ?? 2000);

        // Owner must be in this season's owner list (season-scoped owners)
        const seasonOwners = await prisma.seasonOwner.findMany({
            where: { seasonId: seasonIdNum },
            include: { user: true }
        });

        let resolvedOwnerId: number;
        if (ownerId) {
            const isSeasonOwner = seasonOwners.some(so => so.userId === parseInt(ownerId));
            if (!isSeasonOwner) {
                return res.status(400).json({
                    error: 'Selected owner is not in this season. Add them as an owner for this season first.'
                });
            }
            resolvedOwnerId = parseInt(ownerId);
        } else {
            if (seasonOwners.length === 0) {
                return res.status(400).json({
                    error: 'No owners in this season. Add owners before creating teams.'
                });
            }
            resolvedOwnerId = seasonOwners[0].userId;
        }

        const team = await prisma.team.create({
            data: {
                seasonId: seasonIdNum,
                name: name.trim(),
                ownerId: resolvedOwnerId,
                totalBudget: teamBudget,
                remainingBudget: teamBudget,
                totalPlayers: 0
            },
            include: {
                owner: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        res.status(201).json(team);
    } catch (error: any) {
        console.error('Error creating team:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'A team with this name already exists in this season' });
        }
        res.status(500).json({ error: 'Failed to create team' });
    }
};

export const updateTeam = async (req: AuthRequest, res: Response) => {
    try {
        const { teamId } = req.params;
        const { name, ownerId, budget } = req.body;
        const teamIdNum = parseInt(teamId);

        const existingTeam = await prisma.team.findUnique({ where: { id: teamIdNum } });
        if (!existingTeam) {
            return res.status(404).json({ error: 'Team not found' });
        }

        const updateData: Record<string, any> = {};
        if (name !== undefined) updateData.name = name.trim();
        if (ownerId !== undefined) {
            const isSeasonOwner = await prisma.seasonOwner.findUnique({
                where: {
                    seasonId_userId: { seasonId: existingTeam.seasonId, userId: parseInt(ownerId) }
                }
            });
            if (!isSeasonOwner) {
                return res.status(400).json({
                    error: 'Selected owner is not in this season. Add them as an owner for this season first.'
                });
            }
            updateData.ownerId = parseInt(ownerId);
        }
        if (budget !== undefined) {
            const newBudget = parseInt(budget);
            updateData.totalBudget = newBudget;
            const spent = existingTeam.totalBudget - existingTeam.remainingBudget;
            updateData.remainingBudget = Math.max(0, newBudget - spent);
        }

        const team = await prisma.team.update({
            where: { id: teamIdNum },
            data: updateData,
            include: {
                owner: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        res.json(team);
    } catch (error: any) {
        console.error('Error updating team:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Team not found' });
        }
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'A team with this name already exists in this season' });
        }
        res.status(500).json({ error: 'Failed to update team' });
    }
};

export const deleteTeam = async (req: AuthRequest, res: Response) => {
    try {
        const { teamId } = req.params;
        const teamIdNum = parseInt(teamId);

        await prisma.team.delete({
            where: { id: teamIdNum }
        });

        res.json({ message: 'Team deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting team:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Team not found' });
        }
        res.status(500).json({ error: 'Failed to delete team' });
    }
};
