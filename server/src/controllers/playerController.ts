import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { parse } from 'csv-parse';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

interface AuthRequest extends Request {
    user?: any;
}

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for CSV (memory)
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Configure multer for player images (disk storage)
const imageStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname) || '.jpg';
        const safeExt = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext.toLowerCase()) ? ext : '.jpg';
        cb(null, `player-${Date.now()}${safeExt}`);
    }
});
const imageUpload = multer({
    storage: imageStorage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB for images
    fileFilter: (_req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp/i;
        if (allowed.test(file.mimetype)) cb(null, true);
        else cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed'));
    }
});

// Middleware for file upload
export const uploadMiddleware = upload.single('file');
export const uploadPlayerImageMiddleware = imageUpload.single('image');

// Add player to group
export const addPlayerToGroup = async (req: AuthRequest, res: Response) => {
    try {
        const { groupId } = req.params;
        const { name, category, basePrice, country, imageUrl } = req.body;
        const groupIdNum = parseInt(groupId);

        if (!name || !category || !basePrice) {
            return res.status(400).json({ 
                error: 'Name, category, and basePrice are required' 
            });
        }

        // Verify group exists
        const group = await prisma.group.findUnique({
            where: { id: groupIdNum }
        });

        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        const player = await prisma.player.create({
            data: {
                groupId: groupIdNum,
                name,
                category,
                basePrice: parseInt(basePrice),
                country: country || null,
                imageUrl: imageUrl || null,
                status: 'ACTIVE'
            }
        });

        res.status(201).json(player);
    } catch (error: any) {
        console.error('Error adding player:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ 
                error: 'Player with this name already exists in this group' 
            });
        }
        res.status(500).json({ error: 'Failed to add player' });
    }
};

// Upload players via CSV
export const uploadPlayersCSV = async (req: AuthRequest, res: Response) => {
    try {
        const { groupId } = req.params;
        const groupIdNum = parseInt(groupId);

        if (!req.file) {
            return res.status(400).json({ error: 'CSV file is required' });
        }

        // Verify group exists
        const group = await prisma.group.findUnique({
            where: { id: groupIdNum }
        });

        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        // Parse CSV
        const csvContent = req.file.buffer.toString('utf-8');
        const records = parse(csvContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            bom: true // Handle BOM for Excel-generated CSVs
        }) as unknown as any[];

        const results = {
            success: [] as any[],
            errors: [] as any[]
        };

        for (const record of records) {
            try {
                const { name, category, basePrice, country } = record;

                if (!name || !category || !basePrice) {
                    results.errors.push({
                        row: record,
                        error: 'Missing required fields: name, category, basePrice'
                    });
                    continue;
                }

                const player = await prisma.player.create({
                    data: {
                        groupId: groupIdNum,
                        name: name.trim(),
                        category: category.toUpperCase(),
                        basePrice: parseInt(basePrice),
                        country: country?.trim() || null,
                        status: 'ACTIVE'
                    }
                });

                results.success.push(player);
            } catch (error: any) {
                results.errors.push({
                    row: record,
                    error: error.message
                });
            }
        }

        res.json({
            message: `Processed ${records.length} rows`,
            success: results.success.length,
            errors: results.errors.length,
            details: results
        });
    } catch (error: any) {
        console.error('Error uploading CSV:', error);
        res.status(500).json({ error: 'Failed to upload CSV' });
    }
};

// Get players in group
export const getPlayersByGroup = async (req: AuthRequest, res: Response) => {
    try {
        const { groupId } = req.params;
        const groupIdNum = parseInt(groupId);

        const players = await prisma.player.findMany({
            where: { groupId: groupIdNum },
            orderBy: { name: 'asc' }
        });

        res.json(players);
    } catch (error) {
        console.error('Error fetching players:', error);
        res.status(500).json({ error: 'Failed to fetch players' });
    }
};

// Helper: extract filename from imageUrl and delete from uploads if it's a server file
function deleteOldPlayerImage(oldImageUrl: string | null) {
    if (!oldImageUrl || oldImageUrl.startsWith('http')) return;
    const filename = oldImageUrl.replace(/^\/api\/uploads\//, '').split('/').pop() || oldImageUrl;
    if (!filename) return;
    const filePath = path.join(uploadsDir, filename);
    if (fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
            console.log('Deleted old player image:', filename);
        } catch (e) {
            console.warn('Could not delete old image:', filename, e);
        }
    }
}

// Update player
export const updatePlayer = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, category, basePrice, country, status, imageUrl } = req.body;
        const playerId = parseInt(id);

        // Get existing player to check for old image
        const existing = await prisma.player.findUnique({ where: { id: playerId }, select: { imageUrl: true } });

        const data: Record<string, any> = {};
        if (name !== undefined) data.name = name;
        if (category !== undefined) data.category = category;
        if (basePrice !== undefined) data.basePrice = parseInt(basePrice);
        if (country !== undefined) data.country = country;
        if (status !== undefined) data.status = status;
        if (imageUrl !== undefined) data.imageUrl = imageUrl || null;

        const player = await prisma.player.update({
            where: { id: playerId },
            data
        });

        // Delete old image from server when replaced with new one
        if (imageUrl !== undefined && existing?.imageUrl && existing.imageUrl !== (imageUrl || null)) {
            deleteOldPlayerImage(existing.imageUrl);
        }

        res.json(player);
    } catch (error: any) {
        console.error('Error updating player:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Player not found' });
        }
        res.status(500).json({ error: 'Failed to update player' });
    }
};

// Delete player
export const deletePlayer = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const playerId = parseInt(id);

        // Check if player is used in any seasons
        const seasonPlayers = await prisma.seasonPlayer.findMany({
            where: { playerId: playerId }
        });

        if (seasonPlayers.length > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete player that is used in seasons. Remove from seasons first.' 
            });
        }

        const player = await prisma.player.findUnique({ where: { id: playerId }, select: { imageUrl: true } });
        await prisma.player.delete({
            where: { id: playerId }
        });
        if (player?.imageUrl) deleteOldPlayerImage(player.imageUrl);

        res.json({ message: 'Player deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting player:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Player not found' });
        }
        res.status(500).json({ error: 'Failed to delete player' });
    }
};

// Add players to season (from group players)
export const addPlayersToSeason = async (req: AuthRequest, res: Response) => {
    try {
        const { seasonId } = req.params;
        const { playerIds } = req.body; // Array of player IDs
        const seasonIdNum = parseInt(seasonId);

        if (!Array.isArray(playerIds) || playerIds.length === 0) {
            return res.status(400).json({ error: 'playerIds array is required' });
        }

        // Verify season exists and get group
        const season = await prisma.season.findUnique({
            where: { id: seasonIdNum },
            include: { group: true }
        });

        if (!season) {
            return res.status(404).json({ error: 'Season not found' });
        }

        const results = {
            success: [] as any[],
            errors: [] as any[]
        };

        for (const playerId of playerIds) {
            try {
                // Verify player belongs to the group
                const player = await prisma.player.findUnique({
                    where: { id: playerId }
                });

                if (!player) {
                    results.errors.push({
                        playerId,
                        error: 'Player not found'
                    });
                    continue;
                }

                if (player.groupId !== season.groupId) {
                    results.errors.push({
                        playerId,
                        error: 'Player does not belong to this group'
                    });
                    continue;
                }

                // Create SeasonPlayer entry
                const seasonPlayer = await prisma.seasonPlayer.create({
                    data: {
                        seasonId: seasonIdNum,
                        playerId: playerId,
                        status: 'ACTIVE'
                    },
                    include: {
                        player: true
                    }
                });

                results.success.push(seasonPlayer);
            } catch (error: any) {
                if (error.code === 'P2002') {
                    results.errors.push({
                        playerId,
                        error: 'Player already added to season'
                    });
                } else {
                    results.errors.push({
                        playerId,
                        error: error.message
                    });
                }
            }
        }

        res.json({
            message: `Processed ${playerIds.length} players`,
            success: results.success.length,
            errors: results.errors.length,
            details: results
        });
    } catch (error) {
        console.error('Error adding players to season:', error);
        res.status(500).json({ error: 'Failed to add players to season' });
    }
};

// Get players in season
export const getPlayersBySeason = async (req: AuthRequest, res: Response) => {
    try {
        const { seasonId } = req.params;
        const seasonIdNum = parseInt(seasonId);

        const seasonPlayers = await prisma.seasonPlayer.findMany({
            where: { seasonId: seasonIdNum },
            include: {
                player: true,
                team: {
                    select: { id: true, name: true }
                }
            },
            orderBy: { id: 'asc' }
        });

        res.json(seasonPlayers);
    } catch (error) {
        console.error('Error fetching season players:', error);
        res.status(500).json({ error: 'Failed to fetch season players' });
    }
};

// Update season player
export const updateSeasonPlayer = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { status, soldPrice, teamId } = req.body;
        const seasonPlayerId = parseInt(id);

        const seasonPlayer = await prisma.seasonPlayer.update({
            where: { id: seasonPlayerId },
            data: {
                status,
                soldPrice: soldPrice ? parseInt(soldPrice) : undefined,
                teamId: teamId ? parseInt(teamId) : undefined
            },
            include: {
                player: true,
                team: {
                    select: { id: true, name: true }
                }
            }
        });

        res.json(seasonPlayer);
    } catch (error: any) {
        console.error('Error updating season player:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Season player not found' });
        }
        res.status(500).json({ error: 'Failed to update season player' });
    }
};

// Upload player image
export const uploadPlayerImage = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Image file is required' });
        }
        // Use relative path so it works with client's origin (nginx proxies /api to server)
        const imageUrl = `/api/uploads/${req.file.filename}`;
        res.json({ imageUrl });
    } catch (error: any) {
        console.error('Error uploading player image:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
};

// Remove player from season
export const removePlayerFromSeason = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const seasonPlayerId = parseInt(id);

        // Check if player is sold
        const seasonPlayer = await prisma.seasonPlayer.findUnique({
            where: { id: seasonPlayerId }
        });

        if (!seasonPlayer) {
            return res.status(404).json({ error: 'Season player not found' });
        }

        if (seasonPlayer.status === 'SOLD') {
            return res.status(400).json({ 
                error: 'Cannot remove sold player from season' 
            });
        }

        await prisma.seasonPlayer.delete({
            where: { id: seasonPlayerId }
        });

        res.json({ message: 'Player removed from season successfully' });
    } catch (error: any) {
        console.error('Error removing player from season:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Season player not found' });
        }
        res.status(500).json({ error: 'Failed to remove player from season' });
    }
};
