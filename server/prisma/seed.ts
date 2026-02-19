import { PrismaClient, Role, PlayerStatus, PlayerCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    // 1. Create Auction State
    const auctionState = await prisma.auctionState.upsert({
        where: { id: 1 },
        update: {},
        create: {
            status: 'READY',
            currentPrice: 0,
            version: 0
        }
    });
    console.log('Auction State initialized');

    // 2. Create Admin
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@auction.com' },
        update: {},
        create: {
            email: 'admin@auction.com',
            password: adminPassword,
            name: 'Super Admin',
            role: Role.ADMIN
        }
    });
    console.log('Admin created');

    // 2.1 Create Owners and Teams
    const password = await bcrypt.hash('123456', 10);

    const owners = [
        { email: 'chinnarao@auction.com', name: 'Chinnarao', teamName: 'chinnarao' },
        { email: 'mahesh@auction.com', name: 'Mahesh', teamName: 'mahesh' },
        { email: 'chandu@auction.com', name: 'Chandu', teamName: 'Chandu' },
        { email: 'nivas@auction.com', name: 'Nivas', teamName: 'Nivas' },
    ];

    for (const o of owners) {
        const user = await prisma.user.upsert({
            where: { email: o.email },
            update: {},
            create: {
                email: o.email,
                password,
                name: o.name,
                role: Role.OWNER,
                team: {
                    create: {
                        name: o.teamName
                    }
                }
            }
        });
        console.log(`Owner ${o.name} and Team ${o.teamName} created/verified`);
    }

    // 2.2 Create Viewers
    const viewers = ['viewer1@auction.com', 'viewer2@auction.com'];
    for (const v of viewers) {
        await prisma.user.upsert({
            where: { email: v },
            update: {},
            create: {
                email: v,
                password,
                name: v.split('@')[0],
                role: Role.VIEWER
            }
        });
    }
    console.log('Viewers created');

    // 3. Create Dummy Players
    const players = [
        { name: 'Appanna', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Srikanth', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'KP', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Chandra Sekhar', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Ravi', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Manish', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Krupa', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Jagga', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Poorna', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Rajesh', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Sathya', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Peeru', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Rajasekhar', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Vasu', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Ashok', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Amith', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Srinu', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Mani', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Akhil', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Venky', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Simhachalam', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Chitti Sekhar', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Somesh', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Aravind', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Gopi', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Anil', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Manoj', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Hari', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Praveen Sagar', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Sai Kiran', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Prasanth', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Naveen', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Veeraraju', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Manjji ganesh', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Dileep', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Sunny', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Sai Prabha', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Surendra', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Rahul', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Ananth', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Raghava', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Ramesh', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Chandra', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Santhosh', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Chandu', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Prasanth Friend Srikhar', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Barri Venkat', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Raju', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Naidu', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Naveen peeru friend', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Raja', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Shankar Rahul Friend', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Gopi', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Suresh', category: PlayerCategory.BATSMAN, basePrice: 20 },
        { name: 'Naresh', category: PlayerCategory.BATSMAN, basePrice: 20 }
    ];


    for (const p of players) {
        await prisma.player.create({
            data: {
                name: p.name,
                category: p.category,
                basePrice: p.basePrice,
                status: PlayerStatus.ACTIVE
            }
        });
    }
    console.log('Dummy players created');
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
