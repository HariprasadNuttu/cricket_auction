import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
    user?: any;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        console.error('No token provided');
        return res.status(401).json({ error: 'No token provided' });
    }

    const secret = process.env.JWT_SECRET || 'supersecretkey';

    jwt.verify(token, secret, (err: any, user: any) => {
        if (err) {
            console.error('JWT Verification Error:', err.message);
            console.error('Token:', token.substring(0, 50) + '...');
            console.error('JWT_SECRET:', secret.substring(0, 10) + '...');
            
            // Provide more specific error messages
            if (err.name === 'TokenExpiredError') {
                return res.status(403).json({ 
                    error: 'Token expired', 
                    message: 'Please refresh your token or login again' 
                });
            } else if (err.name === 'JsonWebTokenError') {
                return res.status(403).json({ 
                    error: 'Invalid token', 
                    message: 'Token verification failed' 
                });
            }
            
            return res.status(403).json({ 
                error: 'Authentication failed', 
                message: err.message 
            });
        }
        req.user = user;
        next();
    });
};
