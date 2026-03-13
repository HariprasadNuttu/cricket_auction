import { PrismaClient, Role, PlayerCategory, PlayerStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Player names and categories from user (66 players)
const PLAYERS: { name: string; category: PlayerCategory }[] = [
    { name: 'Harsha', category: PlayerCategory.ALLROUNDER },
    { name: 'Rajesh', category: PlayerCategory.ALLROUNDER },
    { name: 'Chinnaro', category: PlayerCategory.BATSMAN },
    { name: 'Nivas', category: PlayerCategory.ALLROUNDER },
    { name: 'Praveen', category: PlayerCategory.ALLROUNDER },
    { name: 'Rabada', category: PlayerCategory.BOWLER },
    { name: 'Prakash', category: PlayerCategory.ALLROUNDER },
    { name: 'Vijay', category: PlayerCategory.ALLROUNDER },
    { name: 'Hari', category: PlayerCategory.BATSMAN },
    { name: 'Sai Prabha', category: PlayerCategory.BATSMAN },
    { name: 'Anil', category: PlayerCategory.BATSMAN },
    { name: 'Satya', category: PlayerCategory.ALLROUNDER },
    { name: 'Manoj', category: PlayerCategory.ALLROUNDER },
    { name: 'Santhosh', category: PlayerCategory.BATSMAN },
    { name: 'Naidu', category: PlayerCategory.ALLROUNDER },
    { name: 'Akhil', category: PlayerCategory.BATSMAN },
    { name: 'Chandiu (owner)', category: PlayerCategory.BATSMAN },
    { name: 'Srinu', category: PlayerCategory.ALLROUNDER },
    { name: 'Rajsekhar', category: PlayerCategory.BATSMAN },
    { name: 'Manish', category: PlayerCategory.BATSMAN },
    { name: 'Rahul', category: PlayerCategory.ALLROUNDER },
    { name: 'Gopi Dancer', category: PlayerCategory.ALLROUNDER },
    { name: 'Appanna', category: PlayerCategory.BATSMAN },
    { name: 'Surendra', category: PlayerCategory.BATSMAN },
    { name: 'Chandrasekhar', category: PlayerCategory.ALLROUNDER },
    { name: 'Dileep', category: PlayerCategory.ALLROUNDER },
    { name: 'Ch.Naveen', category: PlayerCategory.ALLROUNDER },
    { name: 'Vasu', category: PlayerCategory.ALLROUNDER },
    { name: 'Gopi ( electrical dept )', category: PlayerCategory.BATSMAN },
    { name: 'Ravi', category: PlayerCategory.ALLROUNDER },
    { name: 'Srikanth', category: PlayerCategory.BATSMAN },
    { name: 'Ramesh', category: PlayerCategory.ALLROUNDER },
    { name: 'peeru', category: PlayerCategory.BATSMAN },
    { name: 'Khilana', category: PlayerCategory.ALLROUNDER },
    { name: 'Naresh', category: PlayerCategory.ALLROUNDER },
    { name: 'Gopikrishna', category: PlayerCategory.ALLROUNDER },
    { name: 'Naveen', category: PlayerCategory.BOWLER },
    { name: 'Jagga', category: PlayerCategory.ALLROUNDER },
    { name: 'Somesh Anna', category: PlayerCategory.BOWLER },
    { name: 'Shankar Rahul Friend', category: PlayerCategory.ALLROUNDER },
    { name: 'KP', category: PlayerCategory.BATSMAN },
    { name: 'Rajesh Jr', category: PlayerCategory.BOWLER },
    { name: 'Ananth', category: PlayerCategory.ALLROUNDER },
    { name: 'Amith', category: PlayerCategory.ALLROUNDER },
    { name: 'Sekhar Master', category: PlayerCategory.BATSMAN },
    { name: 'Suresh', category: PlayerCategory.ALLROUNDER },
    { name: 'Raja', category: PlayerCategory.BATSMAN },
    { name: 'Sunny', category: PlayerCategory.ALLROUNDER },
    { name: 'Barri Venkat', category: PlayerCategory.ALLROUNDER },
    { name: 'Venu', category: PlayerCategory.ALLROUNDER },
    { name: 'Raghava', category: PlayerCategory.BOWLER },
    { name: 'Sai Kiran', category: PlayerCategory.ALLROUNDER },
    { name: 'Ganesh', category: PlayerCategory.BATSMAN },
    { name: 'Aravind', category: PlayerCategory.BATSMAN },
    { name: 'Bablu', category: PlayerCategory.ALLROUNDER },
    { name: 'Yeshwanth', category: PlayerCategory.BATSMAN },
    { name: 'Mani', category: PlayerCategory.BOWLER },
    { name: 'mahesh', category: PlayerCategory.BATSMAN },
    { name: 'Veeraraj', category: PlayerCategory.BOWLER },
    { name: 'Ashok', category: PlayerCategory.ALLROUNDER },
    { name: 'Prasanth', category: PlayerCategory.BOWLER },
    { name: 'Srikar', category: PlayerCategory.BATSMAN },
    { name: 'Divakar', category: PlayerCategory.ALLROUNDER },
    { name: 'Ravi ( Divakar )', category: PlayerCategory.ALLROUNDER },
    { name: 'poorna', category: PlayerCategory.ALLROUNDER },
    { name: 'Krupa', category: PlayerCategory.ALLROUNDER }
];

async function main() {
    console.log('🌱 Starting seed...\n');

    // 0. Drop all existing data (in correct order for FK constraints)
    console.log('🗑️  Clearing existing data...');
    await prisma.bidLog.deleteMany();
    await prisma.auctionLog.deleteMany();
    await prisma.auctionState.deleteMany();
    await prisma.seasonPlayer.deleteMany();
    await prisma.team.deleteMany();
    await prisma.seasonOwner.deleteMany();
    await prisma.auctionRoom.deleteMany();
    await prisma.season.deleteMany();
    await prisma.player.deleteMany();
    await prisma.group.deleteMany();
    await prisma.user.deleteMany();
    console.log('✅ Data cleared');

    // 1. Create Admin User
    console.log('\n👤 Creating admin user...');
    const admin = await prisma.user.create({
        data: {
            email: 'admin@auction.com',
            password: await bcrypt.hash('admin123', 10),
            name: 'Admin User',
            role: Role.ADMIN
        }
    });
    console.log('✅ Admin created:', admin.email);

    // 2. Create Group
    console.log('\n📦 Creating group...');
    const group = await prisma.group.create({
        data: {
            name: 'Cricket Loevers Srikakulam',
            description: 'Cricket Loevers Srikakulam League',
            createdById: admin.id
        }
    });
    console.log('✅ Group created:', group.name);

    // 3. Create Season
    console.log('\n📅 Creating season...');
    const season = await prisma.season.create({
        data: {
            groupId: group.id,
            name: 'Season 4',
            year: 2026,
            status: 'DRAFT',
            auctionStarted: false,
            budget: 2000
        }
    });
    console.log('✅ Season created:', season.name);

    // 4. Create Auctioneer User
    console.log('\n🔨 Creating auctioneer user...');
    const auctioneer = await prisma.user.create({
        data: {
            email: 'auctioneer@auction.com',
            password: await bcrypt.hash('auctioneer123', 10),
            name: 'Auctioneer User',
            role: Role.AUCTIONEER
        }
    });
    console.log('✅ Auctioneer created:', auctioneer.email);

    // 5. Assign auctioneer to season and create Auction Room
    console.log('\n🏠 Creating auction room...');
    await prisma.season.update({
        where: { id: season.id },
        data: { auctioneerId: auctioneer.id }
    });
    await prisma.auctionRoom.create({
        data: {
            seasonId: season.id,
            auctioneerId: auctioneer.id,
            name: `${season.name} - ${group.name}`,
            status: 'CREATED'
        }
    });
    console.log('✅ Auction room created');

    // 6. Create Owner Users and Teams
    console.log('\n👥 Creating owners and teams...');
    const teamData = [
        { name: 'Mahesh team', ownerEmail: 'mahesh@owner.com', ownerName: 'Mahesh' },
        { name: 'Naveen', ownerEmail: 'naveen@owner.com', ownerName: 'Naveen' },
        { name: 'Manoj Team', ownerEmail: 'manoju@owner.com', ownerName: 'Manoju' },
        { name: 'Vasu Team', ownerEmail: 'vasu@owner.com', ownerName: 'Vasu' }
    ];

    const teams = [];
    for (const teamInfo of teamData) {
        const owner = await prisma.user.create({
            data: {
                email: teamInfo.ownerEmail,
                password: await bcrypt.hash('owner123', 10),
                name: teamInfo.ownerName,
                role: Role.OWNER
            }
        });

        await prisma.seasonOwner.create({
            data: {
                seasonId: season.id,
                userId: owner.id
            }
        });

        const team = await prisma.team.create({
            data: {
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

    // 7. Create Players (Group level)
    console.log('\n🏏 Creating players...');
    const players = [];
    for (const p of PLAYERS) {
        const player = await prisma.player.create({
            data: {
                groupId: group.id,
                name: p.name.trim(),
                category: p.category,
                basePrice: 20,
                status: PlayerStatus.ACTIVE
            }
        });
        players.push(player);
    }
    console.log(`✅ Created ${players.length} players`);

    // 8. Create SeasonPlayer entries (link players to season)
    console.log('\n🔗 Creating SeasonPlayer entries...');
    for (const player of players) {
        await prisma.seasonPlayer.create({
            data: {
                seasonId: season.id,
                playerId: player.id,
                status: PlayerStatus.ACTIVE,
                soldType: null
            }
        });
    }
    console.log(`✅ Created ${players.length} SeasonPlayer entries`);

    // 9. Create AuctionState for season
    console.log('\n⏱️  Creating auction state...');
    await prisma.auctionState.create({
        data: {
            seasonId: season.id,
            status: 'READY',
            currentPrice: 0,
            version: 0
        }
    });
    console.log('✅ AuctionState created');

    // 10. Create Viewer User
    console.log('\n👁️  Creating viewer user...');
    await prisma.user.create({
        data: {
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
    console.log('\n🔑 Login Credentials:');
    console.log('   Admin: admin@auction.com / admin123');
    console.log('   Auctioneer: auctioneer@auction.com / auctioneer123');
    console.log('   Mahesh: mahesh@owner.com / owner123');
    console.log('   Naveen: naveen@owner.com / owner123');
    console.log('   Manoju: manoju@owner.com / owner123');
    console.log('   Vasu: vasu@owner.com / owner123');
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
