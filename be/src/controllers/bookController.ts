import { Request, Response } from 'express';
import mongoose from 'mongoose';
import mysqlPool from '../config/db-mysql';
import { BookContent, TelemetryLog, BookAnalytics } from '../models';

export const searchBooks = async (req: Request, res: Response): Promise<void> => {
    const keyword = (req.query.keyword as string) || '';
    const type = (req.query.type as string) || 'all';
    const status = (req.query.status as string) || 'all'; // The status the frontend actually wants
    const sessionId = (req.headers['x-session-id'] as string) || 'anon';

    try {
        await TelemetryLog.create({
            session_id: sessionId,
            event_type: 'SEARCH_EXECUTED',
            search_query: `keyword:${keyword}|type:${type}|status:${status}`,
            ip_address: req.ip || 'unknown'
        });

        // FIX #1: Tell MySQL to return 'all' statuses so it doesn't prematurely hide books from us
        const [rows]: any = await mysqlPool.execute('CALL search_books(?, ?, ?)', [keyword, type, 'all']);
        const booksFromDb = rows[0];

        // FIX #2: Enrich with MongoDB (The Absolute Source of Truth)
        const enrichedBooks = await Promise.all(
            booksFromDb.map(async (book: any) => {
                const mongoData = await BookContent.findOne({ mysql_book_id: book.book_id });
                
                return {
                    ...book,
                    // If Mongo says copies > 0, it's available. Period.
                    available: mongoData ? mongoData.inventory.available_copies > 0 : book.available,
                    synopsis: mongoData?.synopsis || 'No synopsis available.',
                    cover_image: mongoData?.cover_image_url || 'https://via.placeholder.com/300x450?text=No+Cover'
                };
            })
        );

        // FIX #3: Apply the frontend's status filter AFTER we know the true MongoDB availability
        const finalFilteredBooks = enrichedBooks.filter((book) => {
            if (status === 'available') return book.available === true;
            if (status === 'borrowed') return book.available === false;
            return true; // If status is 'all'
        });

        res.status(200).json({ status: 'success', data: finalFilteredBooks });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

export const viewBookDetails = async (req: Request, res: Response): Promise<void> => {
    const bookId = Number(req.params.bookId);
    const sessionId = (req.headers['x-session-id'] as string) || 'anon';

    try {
        const [mysqlRows]: any = await mysqlPool.execute(
            `SELECT b.book_id, b.title, b.isbn, c.category, CONCAT(a.first_name, ' ', a.last_name) AS author, is_book_available(b.book_id) AS available 
             FROM books b JOIN authors a ON b.author_id = a.author_id JOIN categories c ON b.category_id = c.category_id WHERE b.book_id = ? LIMIT 1`,
            [bookId]
        );

        if (mysqlRows.length === 0) { res.status(404).json({ status: 'error', message: 'Book not found' }); return; }
        
        const mysqlBook = mysqlRows[0];
        const mongoBook = await BookContent.findOne({ mysql_book_id: bookId });

        if (mongoBook) {
            TelemetryLog.create({
                session_id: sessionId,
                event_type: 'PAGE_VIEW',
                target_book_id: mongoBook._id,
                ip_address: req.ip || 'unknown'
            }).catch(err => console.error(err));

            BookAnalytics.findOneAndUpdate(
                { book_mongo_id: mongoBook._id },
                { $inc: { total_views: 1 } },
                { upsert: true }
            ).catch(err => console.error(err));
        }

        const enrichedBook = {
            ...mysqlBook,
            // FIX: Override MySQL here too just in case!
            available: mongoBook ? mongoBook.inventory.available_copies > 0 : mysqlBook.available,
            synopsis: mongoBook?.synopsis || 'No synopsis available.',
            cover_image: mongoBook?.cover_image_url || 'https://via.placeholder.com/300x450?text=No+Cover',
            inventory: mongoBook?.inventory || { total_copies: 1, available_copies: mysqlBook.available ? 1 : 0 }
        };

        res.status(200).json({ status: 'success', data: enrichedBook });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

export const addBook = async (req: Request, res: Response): Promise<void> => {
    const { title, isbn, authorId, categoryId, synopsis, coverImage, totalCopies } = req.body;
    const sessionId = (req.headers['x-session-id'] as string) || 'admin-session';
    const newMongoId = new mongoose.Types.ObjectId();

    try {
        const [mysqlResult]: any = await mysqlPool.execute(
            'CALL create_book(?, ?, ?, ?, ?)',
            [newMongoId.toString(), authorId, categoryId, title, isbn]
        );
        const mysqlBookId = mysqlResult[0][0].new_book_id;

        await BookContent.create({
            _id: newMongoId,
            mysql_book_id: mysqlBookId,
            synopsis: synopsis || 'No synopsis available.',
            cover_image_url: coverImage || 'https://via.placeholder.com/300x450?text=No+Cover',
            inventory: { total_copies: totalCopies, available_copies: totalCopies }
        });

        await TelemetryLog.create({
            session_id: sessionId,
            event_type: 'UI_CLICK',
            search_query: `Added Book: ${title}`,
            ip_address: req.ip || 'unknown'
        });

        res.status(201).json({ status: 'success', message: 'Book added!', bookId: mysqlBookId });
    } catch (error: any) {
        if (error.message.includes('Duplicate entry')) {
            res.status(400).json({ status: 'error', message: 'ISBN already exists.' });
        } else {
            res.status(500).json({ status: 'error', message: error.message });
        }
    }
};

export const borrowBook = async (req: Request, res: Response): Promise<void> => {
    const { memberId, bookId, librarianId } = req.body;

    try {
        // 1. Verify MongoDB Inventory First
        const mongoBook = await BookContent.findOne({ mysql_book_id: Number(bookId) });
        if (!mongoBook || mongoBook.inventory.available_copies <= 0) {
            res.status(400).json({ status: 'error', message: 'No copies available for checkout.' }); return;
        }

        // 2. Execute MySQL Transaction
        await mysqlPool.execute('CALL process_borrow(?, ?, ?)', [memberId, bookId, librarianId]);

        // 3. FIX: Deduct Copy in MongoDB (-1)
        await BookContent.findOneAndUpdate(
            { mysql_book_id: Number(bookId) },
            { 
                $inc: { 'inventory.available_copies': -1, total_borrows: 1 } 
            }
        );

        res.status(201).json({ status: 'success', message: 'Book borrowed successfully.' });
    } catch (error: any) {
        res.status(400).json({ status: 'error', database_error: error.message });
    }
};

export const returnBook = async (req: Request, res: Response): Promise<void> => {
    const { loanId } = req.params;

    try {
        await mysqlPool.execute('CALL process_return(?)', [loanId]);

        const [rows]: any = await mysqlPool.execute(
            'SELECT book_id, DATEDIFF(return_date, checkout_date) as days_kept FROM loans WHERE loan_id = ?',
            [loanId]
        );
        const loanData = rows[0];

        // Ensure MongoDB is updated appropriately
        const mongoBook = await BookContent.findOne({ mysql_book_id: loanData.book_id });
        if (mongoBook) {
            await BookAnalytics.findOneAndUpdate(
                { book_mongo_id: mongoBook._id },
                { $push: { return_durations: loanData.days_kept }, $inc: { total_returns: 1 } }
            );
            
            // Increment the available copies back up!
            await BookContent.findOneAndUpdate(
                { mysql_book_id: loanData.book_id },
                { $inc: { 'inventory.available_copies': 1 } }
            );
        }

        res.status(200).json({ status: 'success', message: 'Book returned successfully.' });
    } catch (error: any) {
        res.status(400).json({ status: 'error', database_error: error.message });
    }
};