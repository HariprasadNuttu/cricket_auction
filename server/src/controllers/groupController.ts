import { Request, Response } from 'express';
import prisma from '../utils/prisma';

interface AuthRequest extends Request {
    user?: any;
}

export const createGroup = async (req: AuthRequest, res: Response) => {
    try {
        const { name, description } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!name) {
            return res.status(400).json({ error: 'Group name is required' });
        }

        const group = await prisma.group.create({
            data: {
                name,
                description: description || null,
                createdById: userId
            },
            include: {
                creator: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        res.status(201).json(group);
    } catch (error: any) {
        console.error('Error creating group:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Group name already exists' });
        }
        res.status(500).json({ error: 'Failed to create group' });
    }
};

export const getGroups = async (req: AuthRequest, res: Response) => {
    try {
        const groups = await prisma.group.findMany({
            include: {
                creator: {
                    select: { id: true, name: true, email: true }
                },
                _count: {
                    select: {
                        seasons: true,
                        players: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(groups);
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).json({ error: 'Failed to fetch groups' });
    }
};

export const getGroupById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const groupId = parseInt(id);

        const group = await prisma.group.findUnique({
            where: { id: groupId },
            include: {
                creator: {
                    select: { id: true, name: true, email: true }
                },
                seasons: {
                    include: {
                        _count: {
                            select: {
                                teams: true,
                                seasonPlayers: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                },
                players: {
                    orderBy: { name: 'asc' }
                },
                _count: {
                    select: {
                        seasons: true,
                        players: true
                    }
                }
            }
        });

        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        res.json(group);
    } catch (error) {
        console.error('Error fetching group:', error);
        res.status(500).json({ error: 'Failed to fetch group' });
    }
};

export const updateGroup = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const groupId = parseInt(id);

        const group = await prisma.group.update({
            where: { id: groupId },
            data: {
                name,
                description
            }
        });

        res.json(group);
    } catch (error: any) {
        console.error('Error updating group:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Group not found' });
        }
        res.status(500).json({ error: 'Failed to update group' });
    }
};

export const deleteGroup = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const groupId = parseInt(id);

        // Check if group has seasons
        const group = await prisma.group.findUnique({
            where: { id: groupId },
            include: {
                _count: {
                    select: {
                        seasons: true
                    }
                }
            }
        });

        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        if (group._count.seasons > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete group with existing seasons. Delete seasons first.' 
            });
        }

        await prisma.group.delete({
            where: { id: groupId }
        });

        res.json({ message: 'Group deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting group:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Group not found' });
        }
        res.status(500).json({ error: 'Failed to delete group' });
    }
};
