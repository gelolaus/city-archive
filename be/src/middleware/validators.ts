import { z, ZodError } from 'zod';
import { Request, Response, NextFunction } from 'express';

// 1. Define the strict rules (The "Checkers")
export const registerSchema = z.object({
    body: z.object({
        firstName: z.string().min(2, 'First name must be at least 2 characters'),
        lastName: z.string().min(2, 'Last name must be at least 2 characters'),
        email: z.string().email('Invalid email format'),
        phone: z.string().min(10, 'Phone number is too short'),
        password: z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
            .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
            .regex(/[0-9]/, 'Password must contain at least one number')
            .regex(/[@$!%*?&=]/, 'Password must contain at least one special character')
    })
});

// 2. The Express Middleware that intercepts the request
export const validateData = (schema: z.ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            schema.parse({ body: req.body, query: req.query, params: req.params });
            next(); // Data is clean, proceed to controller
        } catch (error: any) {
            if (error instanceof ZodError) {
                res.status(400).json({
                    status: 'error',
                    message: 'Backend Validation Failed',
                    errors: error.flatten().fieldErrors
                });
            } else {
                res.status(400).json({
                    status: 'error',
                    message: 'Unexpected validation error'
                });
            }
        }
    };
};

