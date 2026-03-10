import prisma from '../utils/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Role } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export const loginUser = async (email: string, password: string) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('User not found');

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) throw new Error('Invalid password');

    const accessToken = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
    const refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });

    // Store refresh token hash (in real app, hash it)
    await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken }
    });

    return { accessToken, refreshToken, user };
};

export const refreshAccessToken = async (token: string) => {
    if (!token) throw new Error('No token provided');

    // Verify token
    let payload: any;
    try {
        payload = jwt.verify(token, JWT_SECRET);
    } catch (e) {
        throw new Error('Invalid token');
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.refreshToken !== token) throw new Error('Invalid refresh token');

    // Rotate token
    const newAccessToken = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
    const newRefreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });

    await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: newRefreshToken }
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken, user };
};

export const registerUser = async (email: string, password: string, name: string, role: Role, teamName?: string) => {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new Error('User already exists');

    const hashedPassword = await bcrypt.hash(password, 10);

    // Note: Team creation now requires seasonId
    // For registration, we don't create teams automatically
    // Teams should be created by admin in the admin panel after season is set up
    // This registration flow is kept for backward compatibility but team creation is skipped

    // Normal user create
    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            name,
            role
        }
    });

    return user;
};
