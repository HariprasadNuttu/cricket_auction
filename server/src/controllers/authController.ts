import { Request, Response } from 'express';
import { loginUser, refreshAccessToken } from '../services/authService';

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const { accessToken, refreshToken, user } = await loginUser(email, password);

        // Send refresh token as HTTP-only cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({ accessToken, user: { id: user.id, name: user.name, role: user.role } });
    } catch (error: any) {
        res.status(401).json({ message: error.message });
    }
};

import { registerUser } from '../services/authService';

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, name, role, teamName } = req.body;
        const user = await registerUser(email, password, name, role, teamName);
        res.json({ message: 'User created' });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const refreshToken = async (req: Request, res: Response) => {
    try {
        const token = req.cookies.refreshToken;
        const { accessToken, refreshToken: newRefreshToken, user } = await refreshAccessToken(token);

        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({ accessToken, user: user ? { id: user.id, name: user.name, role: user.role } : null });
    } catch (error: any) {
        res.status(403).json({ message: error.message });
    }
};

export const logout = async (req: Request, res: Response) => {
    res.cookie('refreshToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0,
        path: '/'
    });
    res.json({ message: 'Logged out' });
};
