import { PrismaClient, Role, PlayerCategory, PlayerStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...\n');

    // 1. Create Admin User
    console.log('👤 Creating admin user...');
    const admin = await prisma.user.upsert({
        where: { email: 'admin@auction.com' },
        update: {},
        create: {
            email: 'admin@auction.com',
            password: await bcrypt.hash('admin123', 10),
            name: 'Admin User',
            role: Role.ADMIN
        }
    });
    console.log('✅ Admin created:', admin.email);

    // 2. Create Group
    console.log('\n📦 Creating default group...');
    const group = await prisma.group.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            name: 'Cricket Lovers League',
            description: 'Default cricket league for auction',
            createdById: admin.id
        }
    });
    console.log('✅ Group created:', group.name);

    // 3. Create Season
    console.log('\n📅 Creating default season...');
    const season = await prisma.season.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            groupId: group.id,
            name: '2026 Season',
            year: 2026,
            status: 'DRAFT',
            auctionStarted: false
        }
    });
    console.log('✅ Season created:', season.name);

    // 4. Create Owner Users and Teams
    console.log('\n👥 Creating owners and teams...');
    const teamData = [
        { name: 'Mumbai Indians', ownerEmail: 'owner1@auction.com', ownerName: 'Ravi Kumar' },
        { name: 'Chennai Super Kings', ownerEmail: 'owner2@auction.com', ownerName: 'Suresh Reddy' },
        { name: 'Royal Challengers', ownerEmail: 'owner3@auction.com', ownerName: 'Kiran Sharma' },
        { name: 'Delhi Capitals', ownerEmail: 'owner4@auction.com', ownerName: 'Priya Patel' }
    ];

    const teams = [];
    for (const teamInfo of teamData) {
        const owner = await prisma.user.upsert({
            where: { email: teamInfo.ownerEmail },
            update: {},
            create: {
                email: teamInfo.ownerEmail,
                password: await bcrypt.hash('owner123', 10),
                name: teamInfo.ownerName,
                role: Role.OWNER
            }
        });

        const team = await prisma.team.upsert({
            where: { 
                seasonId_name: {
                    seasonId: season.id,
                    name: teamInfo.name
                }
            },
            update: {},
            create: {
                seasonId: season.id,
                name: teamInfo.name,
                ownerId: owner.id,
                totalBudget: 2000,
                remainingBudget: 2000,
                totalPlayers: 0
            }
        });
        teams.push(team);
        console.log(`✅ Team created: ${team.name} (Owner: ${owner.name})`);
    }

    // 5. Create Players (Group level)
    console.log('\n🏏 Creating players...');
    const playersData = [
        // Batsmen
        { name: 'Virat Kohli', category: PlayerCategory.BATSMAN, basePrice: 50 },
        { name: 'Rohit Sharma', category: PlayerCategory.BATSMAN, basePrice: 50 },
        { name: 'KL Rahul', category: PlayerCategory.BATSMAN, basePrice: 45 },
        { name: 'Shikhar Dhawan', category: PlayerCategory.BATSMAN, basePrice: 40 },
        { name: 'Shubman Gill', category: PlayerCategory.BATSMAN, basePrice: 35 },
        { name: 'Ishan Kishan', category: PlayerCategory.BATSMAN, basePrice: 30 },
        { name: 'Ruturaj Gaikwad', category: PlayerCategory.BATSMAN, basePrice: 30 },
        { name: 'Yashasvi Jaiswal', category: PlayerCategory.BATSMAN, basePrice: 25 },
        { name: 'Tilak Varma', category: PlayerCategory.BATSMAN, basePrice: 25 },
        { name: 'Rinku Singh', category: PlayerCategory.BATSMAN, basePrice: 20 },
        
        // Bowlers
        { name: 'Jasprit Bumrah', category: PlayerCategory.BOWLER, basePrice: 50 },
        { name: 'Mohammed Shami', category: PlayerCategory.BOWLER, basePrice: 45 },
        { name: 'Ravindra Jadeja', category: PlayerCategory.BOWLER, basePrice: 40 },
        { name: 'Yuzvendra Chahal', category: PlayerCategory.BOWLER, basePrice: 35 },
        { name: 'Kuldeep Yadav', category: PlayerCategory.BOWLER, basePrice: 35 },
        { name: 'Arshdeep Singh', category: PlayerCategory.BOWLER, basePrice: 30 },
        { name: 'Mohammed Siraj', category: PlayerCategory.BOWLER, basePrice: 30 },
        { name: 'Umran Malik', category: PlayerCategory.BOWLER, basePrice: 25 },
        { name: 'Avesh Khan', category: PlayerCategory.BOWLER, basePrice: 25 },
        { name: 'Harshal Patel', category: PlayerCategory.BOWLER, basePrice: 20 },
        
        // All-rounders
        { name: 'Hardik Pandya', category: PlayerCategory.ALLROUNDER, basePrice: 50 },
        { name: 'Ravindra Jadeja', category: PlayerCategory.ALLROUNDER, basePrice: 45 },
        { name: 'Axar Patel', category: PlayerCategory.ALLROUNDER, basePrice: 40 },
        { name: 'Washington Sundar', category: PlayerCategory.ALLROUNDER, basePrice: 35 },
        { name: 'Shivam Dube', category: PlayerCategory.ALLROUNDER, basePrice: 30 },
        { name: 'Venkatesh Iyer', category: PlayerCategory.ALLROUNDER, basePrice: 30 },
        { name: 'Rahul Tewatia', category: PlayerCategory.ALLROUNDER, basePrice: 25 },
        { name: 'Shahbaz Ahmed', category: PlayerCategory.ALLROUNDER, basePrice: 25 },
        { name: 'Abhishek Sharma', category: PlayerCategory.ALLROUNDER, basePrice: 20 },
        { name: 'Nitish Rana', category: PlayerCategory.ALLROUNDER, basePrice: 20 },
        
        // Wicket Keepers
        { name: 'MS Dhoni', category: PlayerCategory.WICKETKEEPER, basePrice: 50 },
        { name: 'Rishabh Pant', category: PlayerCategory.WICKETKEEPER, basePrice: 45 },
        { name: 'Dinesh Karthik', category: PlayerCategory.WICKETKEEPER, basePrice: 40 },
        { name: 'Sanju Samson', category: PlayerCategory.WICKETKEEPER, basePrice: 35 },
        { name: 'Ishan Kishan', category: PlayerCategory.WICKETKEEPER, basePrice: 30 },
        { name: 'KL Rahul', category: PlayerCategory.WICKETKEEPER, basePrice: 30 },
        { name: 'Jitesh Sharma', category: PlayerCategory.WICKETKEEPER, basePrice: 25 },
        { name: 'Dhruv Jurel', category: PlayerCategory.WICKETKEEPER, basePrice: 25 },
        { name: 'Prabhsimran Singh', category: PlayerCategory.WICKETKEEPER, basePrice: 20 },
        { name: 'Abishek Porel', category: PlayerCategory.WICKETKEEPER, basePrice: 20 }
    ];

    const players = [];
    for (const playerData of playersData) {
        const player = await prisma.player.upsert({
            where: {
                groupId_name: {
                    groupId: group.id,
                    name: playerData.name
                }
            },
            update: {},
            create: {
                groupId: group.id,
                name: playerData.name,
                category: playerData.category,
                basePrice: playerData.basePrice,
                status: PlayerStatus.ACTIVE
            }
        });
        players.push(player);
    }
    console.log(`✅ Created ${players.length} players`);

    // 6. Create SeasonPlayer entries (link players to season)
    console.log('\n🔗 Creating SeasonPlayer entries...');
    for (const player of players) {
        await prisma.seasonPlayer.upsert({
            where: {
                seasonId_playerId: {
                    seasonId: season.id,
                    playerId: player.id
                }
            },
            update: {},
            create: {
                seasonId: season.id,
                playerId: player.id,
                status: PlayerStatus.ACTIVE,
                soldType: null // No direct assignment initially
            }
        });
    }
    console.log(`✅ Created ${players.length} SeasonPlayer entries`);

    // 7. Create AuctionState for season
    console.log('\n⏱️  Creating auction state...');
    await prisma.auctionState.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            seasonId: season.id,
            status: 'READY',
            currentPrice: 0,
            version: 0
        }
    });
    console.log('✅ AuctionState created');

    // 8. Create Viewer User
    console.log('\n👁️  Creating viewer user...');
    await prisma.user.upsert({
        where: { email: 'viewer@auction.com' },
        update: {},
        create: {
            email: 'viewer@auction.com',
            password: await bcrypt.hash('viewer123', 10),
            name: 'Viewer User',
            role: Role.VIEWER
        }
    });
    console.log('✅ Viewer created');

    console.log('\n✅ Seed completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Group: ${group.name}`);
    console.log(`   - Season: ${season.name}`);
    console.log(`   - Teams: ${teams.length}`);
    console.log(`   - Players: ${players.length}`);
    console.log(`   - SeasonPlayers: ${players.length}`);
    console.log('\n🔑 Login Credentials:');
    console.log('   Admin: admin@auction.com / admin123');
    console.log('   Owner 1: owner1@auction.com / owner123');
    console.log('   Owner 2: owner2@auction.com / owner123');
    console.log('   Owner 3: owner3@auction.com / owner123');
    console.log('   Owner 4: owner4@auction.com / owner123');
    console.log('   Viewer: viewer@auction.com / viewer123');
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
