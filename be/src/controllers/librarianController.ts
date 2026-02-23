import { Request, Response } from 'express';
import mysqlPool from '../config/db-mysql';
import { BookContent, BookAnalytics } from '../models';

export const addBook = async (req: Request, res: Response): Promise<void> => {
    const { authorId, categoryId, title, isbn, synopsis, coverImage, totalCopies } = req.body;

    try {
        // 1. MySQL: Insert core book data
        const [result]: any = await mysqlPool.execute(
            'INSERT INTO books (author_id, category_id, title, isbn) VALUES (?, ?, ?, ?)',
            [authorId, categoryId, title, isbn]
        );

        const newBookId = result.insertId;

        // 2. MongoDB: Create Rich Content Document
        const mongoBook = await BookContent.create({
            mysql_book_id: newBookId,
            synopsis: synopsis || 'No synopsis provided.',
            cover_image_url: coverImage || '/default-cover.png',
            inventory: {
                total_copies: totalCopies || 1,
                available_copies: totalCopies || 1
            }
        });

        // 3. MongoDB: Initialize Analytics Document
        await BookAnalytics.create({
            book_mongo_id: mongoBook._id,
            total_views: 0,
            total_borrows: 0
        });

        res.status(201).json({
            status: 'success',
            message: 'Book added to Hybrid-Polyglot system.',
            data: { mysql_id: newBookId, mongo_id: mongoBook._id }
        });
    } catch (error: any) {
        console.error('Add Book Error:', error.message);
        res.status(400).json({ status: 'error', database_error: error.message });
    }
};

