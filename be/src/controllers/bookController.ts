import { Request, Response } from 'express';
import mysqlPool from '../config/db-mysql';
import { BookContent, TelemetryLog, BookAnalytics } from '../models';

export const searchBooks = async (req: Request, res: Response): Promise<void> => {
    // Cast keyword to string to satisfy MySQL driver
    const keyword = (req.query.keyword as string) || '';
    const sessionId = (req.headers['x-session-id'] as string) || 'anon';

    try {
        await TelemetryLog.create({
            session_id: sessionId,
            event_type: 'SEARCH_EXECUTED',
            search_query: keyword,
            ip_address: req.ip || 'unknown'
        });

        // Use the casted string here
        const [rows]: any = await mysqlPool.execute('CALL search_books(?)', [keyword]);
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
    // Convert URL string param to a Number to match the Mongoose Interface
    const bookId = Number(req.params.bookId);
    const sessionId = (req.headers['x-session-id'] as string) || 'anon';

    try {
        const mongoBook = await BookContent.findOne({ mysql_book_id: bookId });

        if (mongoBook) {
            await TelemetryLog.create({
                session_id: sessionId,
                event_type: 'PAGE_VIEW',
                target_book_id: mongoBook._id,
                ip_address: req.ip || 'unknown'
            });

            await BookAnalytics.findOneAndUpdate(
                { book_mongo_id: mongoBook._id },
                { $inc: { total_views: 1 } },
                { upsert: true }
            );
        }

        res.status(200).json({ status: 'success', message: 'View logged' });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
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

