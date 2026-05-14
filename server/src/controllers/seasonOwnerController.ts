import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

interface AuthRequest extends Request {
    user?: any;
}

export const getSeasonOwners = async (req: AuthRequest, res: Response) => {
    try {
        const { seasonId } = req.params;
        const seasonIdNum = parseInt(seasonId);

        const seasonOwners = await prisma.seasonOwner.findMany({
            where: { seasonId: seasonIdNum },
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        const owners = seasonOwners.map(so => ({
            id: so.user.id,
            name: so.user.name,
            email: so.user.email
        }));

        res.json(owners);
    } catch (error: any) {
        console.error('Error fetching season owners:', error);
        res.status(500).json({ error: 'Failed to fetch owners' });
    }
};

export const addSeasonOwner = async (req: AuthRequest, res: Response) => {
    try {
        const { seasonId } = req.params;
        const { email, password, name, userId } = req.body;
        const seasonIdNum = parseInt(seasonId);

        // Verify season exists
        const season = await prisma.season.findUnique({
            where: { id: seasonIdNum }
        });

        if (!season) {
            return res.status(404).json({ error: 'Season not found' });
        }

        let targetUser;

        if (userId) {
            // Add existing user by ID
            targetUser = await prisma.user.findUnique({
                where: { id: parseInt(userId) }
            });
            if (!targetUser) {
                return res.status(404).json({ error: 'User not found' });
            }
            if (targetUser.role !== 'OWNER') {
                await prisma.user.update({
                    where: { id: targetUser.id },
                    data: { role: 'OWNER' }
                });
            }
            const existingLink = await prisma.seasonOwner.findUnique({
                where: {
                    seasonId_userId: { seasonId: seasonIdNum, userId: targetUser.id }
                }
            });
            if (existingLink) {
                return res.status(400).json({ error: 'Owner already added to this season' });
            }
        } else if (email && password && name) {
            // Create new owner
            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser) {
                // User exists - add to season if not already
                const existingLink = await prisma.seasonOwner.findUnique({
                    where: {
                        seasonId_userId: { seasonId: seasonIdNum, userId: existingUser.id }
                    }
                });
                if (existingLink) {
                    return res.status(400).json({ error: 'Owner already added to this season' });
                }
                if (existingUser.role !== 'OWNER') {
                    await prisma.user.update({
                        where: { id: existingUser.id },
                        data: { role: 'OWNER' }
                    });
                }
                targetUser = existingUser;
            } else {
                const hashedPassword = await bcrypt.hash(password, 10);
                targetUser = await prisma.user.create({
                    data: {
                        email,
                        password: hashedPassword,
                        name,
                        role: Role.OWNER
                    }
                });
            }
        } else {
            return res.status(400).json({ error: 'Provide (email, password, name) to create new owner, or (userId) to add existing owner' });
        }

        const seasonOwner = await prisma.seasonOwner.create({
            data: {
                seasonId: seasonIdNum,
                userId: targetUser.id
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        res.status(201).json({
            id: seasonOwner.user.id,
            name: seasonOwner.user.name,
            email: seasonOwner.user.email
        });
    } catch (error: any) {
        console.error('Error adding season owner:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Owner already added to this season' });
        }
        const message = error?.message || 'Failed to add owner';
        res.status(500).json({ error: 'Failed to add owner', details: message });
    }
};

export const removeSeasonOwner = async (req: AuthRequest, res: Response) => {
    try {
        const { seasonId, userId } = req.params;
        const seasonIdNum = parseInt(seasonId);
        const userIdNum = parseInt(userId);

        // Check if owner has teams in this season
        const teamsWithOwner = await prisma.team.count({
            where: {
                seasonId: seasonIdNum,
                ownerId: userIdNum
            }
        });

        if (teamsWithOwner > 0) {
            return res.status(400).json({
                error: 'Cannot remove owner. They have teams assigned. Reassign or delete teams first.'
            });
        }

        await prisma.seasonOwner.delete({
            where: {
                seasonId_userId: { seasonId: seasonIdNum, userId: userIdNum }
            }
        });

        res.json({ message: 'Owner removed from season' });
    } catch (error: any) {
        console.error('Error removing season owner:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Owner not found in this season' });
        }
        res.status(500).json({ error: 'Failed to remove owner' });
    }
};

const MIN_PASSWORD_LENGTH = 6;

/** Admin-only: set a new password for a user who is a season owner for this season. */
export const resetSeasonOwnerPassword = async (req: AuthRequest, res: Response) => {
    try {
        if (req.user?.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Only administrators can reset owner passwords' });
        }

        const { seasonId, userId } = req.params;
        const { newPassword } = req.body;
        const seasonIdNum = parseInt(seasonId);
        const userIdNum = parseInt(userId);

        if (!newPassword || typeof newPassword !== 'string') {
            return res.status(400).json({ error: 'newPassword is required' });
        }
        if (newPassword.length < MIN_PASSWORD_LENGTH) {
            return res.status(400).json({
                error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
            });
        }

        const link = await prisma.seasonOwner.findUnique({
            where: {
                seasonId_userId: { seasonId: seasonIdNum, userId: userIdNum }
            },
            include: { user: { select: { id: true, role: true, email: true } } }
        });

        if (!link) {
            return res.status(404).json({ error: 'This user is not an owner for this season' });
        }

        if (link.user.role !== Role.OWNER) {
            return res.status(400).json({ error: 'Target user is not an owner account' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: userIdNum },
            data: { password: hashedPassword }
        });

        res.json({ message: 'Password updated successfully' });
    } catch (error: any) {
        console.error('Error resetting owner password:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
};
