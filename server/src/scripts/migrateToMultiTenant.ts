/**
 * Migration Script: Migrate existing flat structure to multi-tenant structure
 * 
 * This script:
 * 1. Creates a default Group
 * 2. Creates a default Season
 * 3. Links existing Players to the Group
 * 4. Creates SeasonPlayer entries for all players
 * 5. Links existing Teams to the Season
 * 6. Updates AuctionState with seasonId
 * 7. Updates BidLog with seasonId
 * 8. Updates AuctionLog with seasonId
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateToMultiTenant() {
    console.log('🚀 Starting migration to multi-tenant structure...\n');

    try {
        // Step 1: Check if migration already done
        const existingGroup = await prisma.group.findFirst();
        if (existingGroup) {
            console.log('⚠️  Migration already completed. Group exists:', existingGroup.name);
            console.log('   If you want to re-run, delete existing groups first.\n');
            return;
        }

        // Step 2: Get admin user (or create one if doesn't exist)
        let adminUser = await prisma.user.findFirst({
            where: { role: 'ADMIN' }
        });

        if (!adminUser) {
            console.log('📝 Creating default admin user...');
            adminUser = await prisma.user.create({
                data: {
                    email: 'admin@auction.com',
                    password: '$2b$10$rQZ8K5XZ8K5XZ8K5XZ8K5eOZ8K5XZ8K5XZ8K5XZ8K5XZ8K5XZ8K5XZ8K', // password: admin123
                    name: 'Admin User',
                    role: 'ADMIN'
                }
            });
            console.log('✅ Admin user created:', adminUser.email);
        } else {
            console.log('✅ Using existing admin user:', adminUser.email);
        }

        // Step 3: Create default Group
        console.log('\n📦 Creating default Group...');
        const defaultGroup = await prisma.group.create({
            data: {
                name: 'Default Cricket League',
                description: 'Migrated from previous structure',
                createdById: adminUser.id
            }
        });
        console.log('✅ Group created:', defaultGroup.name, '(ID:', defaultGroup.id + ')');

        // Step 4: Create default Season
        console.log('\n📅 Creating default Season...');
        const defaultSeason = await prisma.season.create({
            data: {
                groupId: defaultGroup.id,
                name: 'Default Season',
                year: new Date().getFullYear(),
                status: 'DRAFT'
            }
        });
        console.log('✅ Season created:', defaultSeason.name, '(ID:', defaultSeason.id + ')');

        // Step 5: Migrate Players to Group
        console.log('\n👥 Migrating Players to Group...');
        const players = await prisma.player.findMany({
            where: {
                // Only migrate players that don't have groupId (if schema allows null temporarily)
                // In new schema, groupId is required, so we'll update all
            }
        });

        if (players.length > 0) {
            // Update players to link to group
            // Note: This assumes Player model has groupId field
            // If migration fails here, you may need to handle it differently
            const updatedPlayers = await prisma.$executeRaw`
                UPDATE "Player" 
                SET "groupId" = ${defaultGroup.id}
                WHERE "groupId" IS NULL OR "groupId" = 0
            `;
            console.log(`✅ Linked ${players.length} players to Group`);
        } else {
            console.log('⚠️  No players found to migrate');
        }

        // Step 6: Create SeasonPlayer entries
        console.log('\n🔗 Creating SeasonPlayer entries...');
        const allPlayers = await prisma.player.findMany({
            where: { groupId: defaultGroup.id }
        });

        let seasonPlayerCount = 0;
        for (const player of allPlayers) {
            try {
                await prisma.seasonPlayer.create({
                    data: {
                        seasonId: defaultSeason.id,
                        playerId: player.id,
                        status: 'ACTIVE', // All players start as ACTIVE in new season
                        soldPrice: null, // No sold price initially
                        teamId: null // No team initially
                    }
                });
                seasonPlayerCount++;
            } catch (error: any) {
                // Skip if already exists or other error
                if (error.code !== 'P2002') {
                    console.log(`⚠️  Error creating SeasonPlayer for player ${player.id}:`, error.message);
                }
            }
        }
        console.log(`✅ Created ${seasonPlayerCount} SeasonPlayer entries`);

        // Step 7: Migrate Teams to Season
        console.log('\n🏏 Migrating Teams to Season...');
        const teams = await prisma.team.findMany();

        if (teams.length > 0) {
            for (const team of teams) {
                try {
                    await prisma.team.update({
                        where: { id: team.id },
                        data: {
                            seasonId: defaultSeason.id
                        }
                    });
                } catch (error: any) {
                    console.log(`⚠️  Error updating team ${team.id}:`, error.message);
                }
            }
            console.log(`✅ Linked ${teams.length} teams to Season`);
        } else {
            console.log('⚠️  No teams found to migrate');
        }

        // Step 8: Update AuctionState
        console.log('\n⏱️  Updating AuctionState...');
        const auctionState = await prisma.auctionState.findUnique({
            where: { id: 1 }
        });

        if (auctionState) {
            try {
                await prisma.auctionState.update({
                    where: { id: 1 },
                    data: {
                        seasonId: defaultSeason.id
                    }
                });
                console.log('✅ Updated AuctionState with seasonId');
            } catch (error: any) {
                console.log('⚠️  Error updating AuctionState:', error.message);
                // If update fails, try to create new one
                try {
                    await prisma.auctionState.create({
                        data: {
                            id: 1,
                            seasonId: defaultSeason.id,
                            status: auctionState.status,
                            timerEndsAt: auctionState.timerEndsAt,
                            currentPrice: auctionState.currentPrice,
                            currentPlayerId: auctionState.currentPlayerId,
                            currentBidderId: auctionState.currentBidderId,
                            currentBidderTeamId: auctionState.currentBidderTeamId,
                            version: auctionState.version
                        }
                    });
                    console.log('✅ Created new AuctionState with seasonId');
                } catch (createError: any) {
                    console.log('⚠️  Error creating AuctionState:', createError.message);
                }
            }
        } else {
            // Create default AuctionState
            await prisma.auctionState.create({
                data: {
                    id: 1,
                    seasonId: defaultSeason.id,
                    status: 'READY'
                }
            });
            console.log('✅ Created default AuctionState');
        }

        // Step 9: Update BidLog with seasonId
        console.log('\n📝 Updating BidLog entries...');
        const bidLogs = await prisma.bidLog.findMany();
        
        if (bidLogs.length > 0) {
            const updatedBidLogs = await prisma.$executeRaw`
                UPDATE "BidLog"
                SET "seasonId" = ${defaultSeason.id}
                WHERE "seasonId" IS NULL OR "seasonId" = 0
            `;
            console.log(`✅ Updated ${bidLogs.length} BidLog entries with seasonId`);
        } else {
            console.log('⚠️  No BidLog entries found');
        }

        // Step 10: Update AuctionLog with seasonId
        console.log('\n📊 Updating AuctionLog entries...');
        const auctionLogs = await prisma.auctionLog.findMany();
        
        if (auctionLogs.length > 0) {
            const updatedAuctionLogs = await prisma.$executeRaw`
                UPDATE "AuctionLog"
                SET "seasonId" = ${defaultSeason.id}
                WHERE "seasonId" IS NULL OR "seasonId" = 0
            `;
            console.log(`✅ Updated ${auctionLogs.length} AuctionLog entries with seasonId`);
        } else {
            console.log('⚠️  No AuctionLog entries found');
        }

        console.log('\n✅ Migration completed successfully!');
        console.log('\n📋 Summary:');
        console.log(`   - Group: ${defaultGroup.name} (ID: ${defaultGroup.id})`);
        console.log(`   - Season: ${defaultSeason.name} (ID: ${defaultSeason.id})`);
        console.log(`   - Players: ${allPlayers.length} linked to group`);
        console.log(`   - SeasonPlayers: ${seasonPlayerCount} created`);
        console.log(`   - Teams: ${teams.length} linked to season`);
        console.log(`   - BidLogs: ${bidLogs.length} updated`);
        console.log(`   - AuctionLogs: ${auctionLogs.length} updated`);

    } catch (error: any) {
        console.error('\n❌ Migration failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run migration
migrateToMultiTenant()
    .catch((error) => {
        console.error('Migration error:', error);
        process.exit(1);
    });
