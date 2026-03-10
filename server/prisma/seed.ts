import { PrismaClient, Role, PlayerCategory, PlayerStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Player names from user (64 players) - using BATSMAN and basePrice 20 as defaults
const PLAYER_NAMES = [
    'Harsha', 'Rajesh', 'Chinnaro', 'Nivas',
    'Praveen', 'Rabada', 'Prakash', 'Vijay',
    'Hari', 'Sai Prabha', 'Anil', 'Satya',
    'Manoj', 'Santhosh', 'Naidu', 'Akhil',
    'Chandiu (owner)', 'Srinu', 'Rajsekhar', 'Manish',
    'Rahul', 'Gopi Dancer', 'Appanna', 'Surendra',
    'Chandrasekhar', 'Dileep', 'Ch.Naveen', 'Vasu',
    'Gopi ( electrical dept )', 'Ravi', 'Srikanth', 'Ramesh',
    'peeru', 'Khilana', 'Naresh', 'Gopikrishna',
    'Naveen', 'Jagga', 'Somesh Anna', 'Shankar Rahul Friend',
    'KP', 'Rajesh Jr', 'Ananth', 'Amith',
    'Sekhar Master', 'Suresh', 'Raja', 'Sunny',
    'Barri Venkat', 'Venu', 'Raghava', 'Sai Kiran',
    'Ganesh', 'Aravind', 'Bablu', 'Yeshwanth',
    'Mani', 'mahesh', 'Veeraraj', 'Ashok',
    'Prasanth', 'Srikar', 'Divakar', 'Ravi ( Divakar )'
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
    for (const name of PLAYER_NAMES) {
        const player = await prisma.player.create({
            data: {
                groupId: group.id,
                name: name.trim(),
                category: PlayerCategory.BATSMAN,
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
