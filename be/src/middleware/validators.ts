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

// 2. Create Book Schema
export const createBookSchema = z.object({
    body: z.object({
        title: z.string().min(2, 'Title must be at least 2 characters'),
        isbn: z.string().min(10, 'ISBN must be valid'),
        authorId: z.number().int().positive('Please select a valid author'),
        
        // FIX: Allow categoryId to be null if they are creating a new one
        categoryId: z.number().int().positive('Please select a valid category').nullable().optional(),
        
        // FIX: Tell Zod it's okay to receive the new category name
        newCategoryName: z.string().nullable().optional(),
        
        synopsis: z.string().optional(),
        coverImage: z.string().url('Must be a valid URL').optional().or(z.literal('')),
        totalCopies: z.number().int().min(1, 'Must have at least 1 copy')
    })
});

// 3. The Express Middleware that intercepts the request
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

