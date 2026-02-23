import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export interface AuthRequest extends Request {
    user?: any;
}

// Checker: Is the user logged in?
export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const token = req.header('Authorization')?.split(' ')[1]; // Expects "Bearer <token>"

    if (!token) {
        res.status(401).json({ status: 'error', message: 'Access Denied. No token provided.' });
        return;
    }

    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified;
        next();
    } catch (error) {
        res.status(403).json({ status: 'error', message: 'Invalid or expired token.' });
    }
};

// Checker: Is the user a Librarian?
export const isLibrarian = (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (req.user && req.user.role === 'librarian') {
        next();
    } else {
        res.status(403).json({ status: 'error', message: 'Access Denied. Librarian privileges required.' });
    }
};

