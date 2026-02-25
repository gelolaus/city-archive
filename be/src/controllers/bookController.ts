import { Request, Response } from 'express';
import mysqlPool from '../config/db-mysql';
import mongoose from 'mongoose';
import { BookContent, TelemetryLog, BookAnalytics } from '../models';

export const searchBooks = async (req: Request, res: Response): Promise<void> => {
    // Cast keyword and filters to string to satisfy MySQL driver
    const keyword = (req.query.keyword as string) || '';
    const type = (req.query.type as string) || 'all';
    const status = (req.query.status as string) || 'all';
    const sessionId = (req.headers['x-session-id'] as string) || 'anon';

    try {
        await TelemetryLog.create({
            session_id: sessionId,
            event_type: 'SEARCH_EXECUTED',
            search_query: `keyword:${keyword}|type:${type}|status:${status}`, // Better logging
            ip_address: req.ip || 'unknown'
        });

        // Use the casted strings to call the upgraded 3-parameter SQL procedure
        const [rows]: any = await mysqlPool.execute('CALL search_books(?, ?, ?)', [keyword, type, status]);
        const booksFromDb = rows[0];

        const enrichedBooks = await Promise.all(
            booksFromDb.map(async (book: any) => {
                const mongoData = await BookContent.findOne({ mysql_book_id: book.book_id });
                return {
                    ...book,
                    synopsis: mongoData?.synopsis || 'No synopsis available.',
                    cover_image: mongoData?.cover_image_url || '/default.png'
                };
            })
        );

        res.status(200).json({ status: 'success', data: enrichedBooks });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

export const viewBookDetails = async (req: Request, res: Response): Promise<void> => {
    const bookId = Number(req.params.bookId);
    const sessionId = (req.headers['x-session-id'] as string) || 'anon';

    try {
        // 1. Fetch Relational Data from MySQL
        const [mysqlRows]: any = await mysqlPool.execute(
            `SELECT b.book_id, b.title, b.isbn, c.category, CONCAT(a.first_name, ' ', a.last_name) AS author, is_book_available(b.book_id) AS available 
             FROM books b 
             JOIN authors a ON b.author_id = a.author_id 
             JOIN categories c ON b.category_id = c.category_id 
             WHERE b.book_id = ? LIMIT 1`,
            [bookId]
        );

        if (mysqlRows.length === 0) {
            res.status(404).json({ status: 'error', message: 'Book not found in database.' });
            return;
        }

        const mysqlBook = mysqlRows[0];

        // 2. Fetch Rich Content & Telemetry from MongoDB
        const mongoBook = await BookContent.findOne({ mysql_book_id: bookId });

        if (mongoBook) {
            // Log the view asynchronously (don't block the user from seeing the page)
            TelemetryLog.create({
                session_id: sessionId,
                event_type: 'PAGE_VIEW',
                target_book_id: mongoBook._id,
                ip_address: req.ip || 'unknown'
            }).catch(err => console.error("Telemetry error:", err));

            BookAnalytics.findOneAndUpdate(
                { book_mongo_id: mongoBook._id },
                { $inc: { total_views: 1 } },
                { upsert: true }
            ).catch(err => console.error("Analytics error:", err));
        }

        // 3. Merge and send to frontend
        const enrichedBook = {
            ...mysqlBook,
            synopsis: mongoBook?.synopsis || 'No synopsis available for this title.',
            cover_image: mongoBook?.cover_image_url || 'https://via.placeholder.com/300x450?text=No+Cover',
            tags: mongoBook?.tags_and_keywords || [],
            inventory: mongoBook?.inventory || { total_copies: 1, available_copies: mysqlBook.available ? 1 : 0 }
        };

        res.status(200).json({ status: 'success', data: enrichedBook });
    } catch (error: any) {
        console.error('View Book Error:', error.message);
        res.status(500).json({ status: 'error', message: 'Failed to fetch book details.' });
    }
};

export const borrowBook = async (req: Request, res: Response): Promise<void> => {
    const { memberId, bookId, librarianId } = req.body;

    try {
        await mysqlPool.execute('CALL process_borrow(?, ?, ?)', [memberId, bookId, librarianId]);

        // Cast bookId to number for MongoDB lookup
        const mongoBook = await BookContent.findOne({ mysql_book_id: Number(bookId) });

        if (mongoBook) {
            await BookAnalytics.findOneAndUpdate(
                { book_mongo_id: mongoBook._id },
                { $inc: { total_borrows: 1 } }
            );
        }

        res.status(201).json({ status: 'success', message: 'Book borrowed successfully.' });
    } catch (error: any) {
        res.status(400).json({ status: 'error', database_error: error.message });
    }
};

export const returnBook = async (req: Request, res: Response): Promise<void> => {
    const { loanId } = req.params; // The ID of the specific loan

    try {
        // 1. MySQL: Execute the return procedure
        // This marks the book as returned and calculates fines if any.
        await mysqlPool.execute('CALL process_return(?)', [loanId]);

        // 2. Fetch the loan data to update MongoDB Analytics
        const [rows]: any = await mysqlPool.execute(
            'SELECT book_id, DATEDIFF(return_date, checkout_date) as days_kept FROM loans WHERE loan_id = ?',
            [loanId]
        );
        const loanData = rows[0];

        // 3. MongoDB: Update Average Return Time
        const mongoBook = await BookContent.findOne({ mysql_book_id: loanData.book_id });
        if (mongoBook) {
            await BookAnalytics.findOneAndUpdate(
                { book_mongo_id: mongoBook._id },
                {
                    $push: { return_durations: loanData.days_kept },
                    $inc: { total_returns: 1 }
                }
            );
        }

        res.status(200).json({ status: 'success', message: 'Book returned successfully.' });
    } catch (error: any) {
        res.status(400).json({ status: 'error', database_error: error.message });
    }
};

export const addBook = async (req: Request, res: Response): Promise<void> => {
    const { title, isbn, authorId, categoryId, synopsis, coverImage, totalCopies } = req.body;
    const sessionId = (req.headers['x-session-id'] as string) || 'admin-session';

    // 1. Generate MongoDB ObjectId first so we can link them
    const newMongoId = new mongoose.Types.ObjectId();

    try {
        // 2. Insert into MySQL using our new Stored Procedure
        const [mysqlResult]: any = await mysqlPool.execute(
            'CALL create_book(?, ?, ?, ?, ?)',
            [newMongoId.toString(), authorId, categoryId, title, isbn]
        );

        // Stored procedure returns the ID in the first row of the first array
        const mysqlBookId = mysqlResult[0][0].new_book_id;

        // 3. Insert rich content into MongoDB
        await BookContent.create({
            _id: newMongoId,
            mysql_book_id: mysqlBookId,
            synopsis: synopsis || 'No synopsis available.',
            cover_image_url: coverImage || 'https://via.placeholder.com/300x450?text=No+Cover',
            inventory: {
                total_copies: totalCopies,
                available_copies: totalCopies // All copies are available initially!
            }
        });

        // 4. Log the action
        await TelemetryLog.create({
            session_id: sessionId,
            event_type: 'UI_CLICK',
            search_query: `Added Book: ${title}`,
            ip_address: req.ip || 'unknown'
        });

        res.status(201).json({ status: 'success', message: 'Book successfully added to database!', bookId: mysqlBookId });
    } catch (error: any) {
        console.error('Add Book Error:', error.message);
        // Catch duplicate ISBNs from MySQL
        if (error.message.includes('Duplicate entry')) {
            res.status(400).json({ status: 'error', message: 'A book with this ISBN already exists.' });
        } else {
            res.status(500).json({ status: 'error', message: 'Failed to add book.', database_error: error.message });
        }
    }
};