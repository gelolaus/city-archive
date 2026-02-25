import { Request, Response } from 'express';
import mongoose from 'mongoose';
import mysqlPool from '../config/db-mysql';
import { BookContent, TelemetryLog, BookAnalytics, TransactionLedger, MemberProfile, AuditLog } from '../models';

// ==========================================
// BULLETPROOF AUDIT HELPER (TypeScript Fix Applied)
// ==========================================
const safeAuditLog = async (req: Request, action: string, entity_type: string, entity_id: any, details: string) => {
    try {
        const user = (req as any).user || { id: 999, username: 'System_Admin' };
        await AuditLog.create({
            librarian_id: user.id || 999,
            username: user.username || 'System_Admin',
            action,
            entity_type,
            entity_id: String(entity_id), // Forces any input into a safe string
            details
        });
    } catch (error: any) {
        console.error(`[NON-FATAL AUDIT ERROR] Failed to log ${action}:`, error.message);
    }
};
// ==========================================

export const searchBooks = async (req: Request, res: Response): Promise<void> => {
    const keyword = (req.query.keyword as string) || '';
    const type = (req.query.type as string) || 'all';
    const status = (req.query.status as string) || 'all';
    const sessionId = (req.headers['x-session-id'] as string) || 'anon';

    try {
        await TelemetryLog.create({
            session_id: sessionId,
            event_type: 'SEARCH_EXECUTED',
            search_query: keyword.trim() === '' ? 'Empty Search' : keyword.trim(),
            ip_address: req.ip || 'unknown'
        });

        const [rows]: any = await mysqlPool.execute('CALL search_books(?, ?, ?)', [keyword, type, 'all']);
        
        const enrichedBooks = await Promise.all(
            rows[0].map(async (book: any) => {
                const mongoData = await BookContent.findOne({ mysql_book_id: book.book_id });
                return {
                    ...book,
                    available: mongoData ? mongoData.inventory.available_copies > 0 : book.available,
                    synopsis: mongoData?.synopsis || 'No synopsis available.',
                    cover_image: mongoData?.cover_image_url || 'https://via.placeholder.com/300x450?text=No+Cover',
                    total_copies: mongoData ? mongoData.inventory.total_copies : 1
                };
            })
        );

        const finalFilteredBooks = enrichedBooks.filter((book) => {
            if (status === 'available') return book.available === true;
            if (status === 'borrowed') return book.available === false;
            return true; 
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
                target_book_id: mongoBook._id as any,
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

        await safeAuditLog(req, 'BOOK_ADD', 'BOOK', mysqlBookId, `Added new book: "${title}" (ISBN: ${isbn})`);

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
        const mongoBook = await BookContent.findOne({ mysql_book_id: Number(bookId) });
        if (!mongoBook || mongoBook.inventory.available_copies <= 0) {
            res.status(400).json({ status: 'error', message: 'No copies available for checkout.' }); return;
        }

        await mysqlPool.execute('CALL process_borrow(?, ?, ?)', [memberId, bookId, librarianId]);

        await BookContent.findOneAndUpdate(
            { mysql_book_id: Number(bookId) },
            { $inc: { 'inventory.available_copies': -1 } }
        );

        await BookAnalytics.findOneAndUpdate(
            { book_mongo_id: mongoBook._id },
            { $inc: { total_borrows: 1 } },
            { upsert: true }
        );

        let memberProfile = await MemberProfile.findOne({ mysql_member_id: Number(memberId) });
        if (!memberProfile) {
            memberProfile = await MemberProfile.create({ mysql_member_id: Number(memberId) });
        }

        await TransactionLedger.create({
            action: 'BORROW_INITIATED',
            member_mongo_id: memberProfile._id as any,
            book_mongo_id: mongoBook._id as any
        });

        await safeAuditLog(req, 'BORROW_INITIATED', 'LOAN', `M${memberId}-B${bookId}`, `Issued loan for Book #${bookId} to Member #${memberId}`);

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
            'SELECT book_id, member_id, DATEDIFF(return_date, checkout_date) as days_kept FROM loans WHERE loan_id = ?',
            [loanId]
        );
        const loanData = rows[0];

        const mongoBook = await BookContent.findOne({ mysql_book_id: loanData.book_id });
        if (mongoBook) {
            await BookContent.findOneAndUpdate(
                { mysql_book_id: loanData.book_id },
                { $inc: { 'inventory.available_copies': 1 } }
            );

            let memberProfile = await MemberProfile.findOne({ mysql_member_id: loanData.member_id });
            if (!memberProfile) {
                memberProfile = await MemberProfile.create({ mysql_member_id: loanData.member_id });
            }

            await TransactionLedger.create({
                mysql_loan_id: Number(loanId),
                action: 'BOOK_RETURNED',
                member_mongo_id: memberProfile._id as any,
                book_mongo_id: mongoBook._id as any,
                duration_days: loanData.days_kept
            });

            const allReturns = await TransactionLedger.find({ 
                book_mongo_id: mongoBook._id, 
                action: 'BOOK_RETURNED' 
            });
            
            const totalDays = allReturns.reduce((sum, t) => sum + (t.duration_days || 0), 0);
            const avgTime = allReturns.length > 0 ? parseFloat((totalDays / allReturns.length).toFixed(2)) : 0;

            await BookAnalytics.findOneAndUpdate(
                { book_mongo_id: mongoBook._id },
                { avg_return_time_days: avgTime }
            );

            await safeAuditLog(req, 'BOOK_RETURNED', 'LOAN', loanId, `Processed return for Loan #${loanId}. Kept for ${loanData.days_kept} days.`);
        }

        res.status(200).json({ status: 'success', message: 'Book returned successfully.' });
    } catch (error: any) {
        res.status(400).json({ status: 'error', database_error: error.message });
    }
};

export const getActiveLoansByMember = async (req: Request, res: Response): Promise<void> => {
    const memberId = Number(req.params.memberId);
    try {
        const [rows]: any = await mysqlPool.execute('CALL get_member_current_loans(?)', [memberId]);
        res.status(200).json({ status: 'success', data: rows[0] });
    } catch (error: any) {
        console.error('Fetch Loans Error:', error.message);
        res.status(500).json({ status: 'error', message: 'Failed to fetch active loans.' });
    }
};

export const getAllActiveLoans = async (req: Request, res: Response): Promise<void> => {
    try {
        const [rows]: any = await mysqlPool.execute(
            `SELECT l.loan_id, CONCAT(m.first_name, ' ', m.last_name) AS member_name, b.title, DATE_FORMAT(l.due_date, '%Y-%m-%d') as due_date
             FROM loans l JOIN members m ON l.member_id = m.member_id JOIN books b ON l.book_id = b.book_id
             WHERE l.return_date IS NULL ORDER BY l.due_date ASC`
        );
        res.status(200).json({ status: 'success', data: rows });
    } catch (error: any) {
        console.error('Fetch All Active Loans Error:', error.message);
        res.status(500).json({ status: 'error', message: 'Failed to fetch active loans.' });
    }
};

export const getUnpaidFines = async (req: Request, res: Response): Promise<void> => {
    try {
        const [rows]: any = await mysqlPool.execute(`
            SELECT f.fine_id, f.amount, DATE_FORMAT(f.created_at, '%Y-%m-%d') as issued_date,
                   l.loan_id, b.title, CONCAT(m.first_name, ' ', m.last_name) AS member_name, m.member_id
            FROM fines f JOIN loans l ON f.loan_id = l.loan_id JOIN books b ON l.book_id = b.book_id JOIN members m ON l.member_id = m.member_id
            WHERE f.is_paid = FALSE ORDER BY f.created_at DESC
        `);
        res.status(200).json({ status: 'success', data: rows });
    } catch (error: any) {
        console.error('Fetch Fines Error:', error.message);
        res.status(500).json({ status: 'error', message: 'Failed to fetch unpaid fines.' });
    }
};

export const settleFine = async (req: Request, res: Response): Promise<void> => {
    const fineId = Number(req.params.fineId);

    try {
        const [fineDataRows]: any = await mysqlPool.execute(`
            SELECT f.fine_id, f.amount, l.member_id, l.book_id
            FROM fines f JOIN loans l ON f.loan_id = l.loan_id WHERE f.fine_id = ?
        `, [fineId]);

        if (fineDataRows.length === 0) {
            res.status(404).json({ status: 'error', message: 'Fine not found.' }); return;
        }
        const fineData = fineDataRows[0];

        await mysqlPool.execute('CALL process_fine_payment(?)', [fineId]);

        const mongoBook = await BookContent.findOne({ mysql_book_id: fineData.book_id });
        let memberProfile = await MemberProfile.findOne({ mysql_member_id: fineData.member_id });
        
        if (!memberProfile) {
            memberProfile = await MemberProfile.create({ mysql_member_id: fineData.member_id });
        }

        if (mongoBook) {
            await TransactionLedger.create({
                mysql_fine_id: fineId,
                action: 'FINE_PAID',
                member_mongo_id: memberProfile._id as any,
                book_mongo_id: mongoBook._id as any
            });

            await safeAuditLog(req, 'FINE_SETTLED', 'FINE', fineId, `Settled fine of ₱${fineData.amount} for Member #${fineData.member_id}.`);
        }

        res.status(200).json({ status: 'success', message: 'Fine settled and recorded in ledger.' });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

export const runDiagnostics = async (req: Request, res: Response): Promise<void> => {
    try {
        const [mysqlBooks]: any = await mysqlPool.execute('SELECT book_id, title FROM books');
        const mysqlIds = mysqlBooks.map((b: any) => b.book_id);

        const mongoBooks = await BookContent.find({}, 'mysql_book_id');
        const mongoIds = mongoBooks.map(b => b.mysql_book_id);

        const mysqlOrphans = mysqlBooks.filter((b: any) => !mongoIds.includes(b.book_id));
        const mongoOrphans = mongoBooks.filter(b => !mysqlIds.includes(b.mysql_book_id));

        res.status(200).json({
            status: 'success',
            data: {
                mysqlOrphans,
                mongoOrphans,
                isHealthy: mysqlOrphans.length === 0 && mongoOrphans.length === 0
            }
        });
    } catch (error: any) {
        console.error('Diagnostics Error:', error.message);
        res.status(500).json({ status: 'error', message: 'Failed to run system diagnostics.' });
    }
};

export const repairDatabases = async (req: Request, res: Response): Promise<void> => {
    try {
        const [mysqlBooks]: any = await mysqlPool.execute('SELECT book_id, title FROM books');
        const mysqlIds = mysqlBooks.map((b: any) => b.book_id);
        const mongoBooks = await BookContent.find({}, 'mysql_book_id');
        const mongoIds = mongoBooks.map(b => b.mysql_book_id);

        const mysqlOrphans = mysqlBooks.filter((b: any) => !mongoIds.includes(b.book_id));
        const mongoOrphans = mongoBooks.filter(b => !mysqlIds.includes(b.mysql_book_id));

        for (const orphan of mysqlOrphans) {
            await BookContent.create({
                mysql_book_id: orphan.book_id,
                synopsis: 'SYSTEM RECOVERY: Auto-generated document. Please update synopsis.',
                cover_image_url: 'https://via.placeholder.com/300x450?text=Recovered+Data',
                inventory: { total_copies: 1, available_copies: 1 }
            });
        }

        for (const orphan of mongoOrphans) {
            await BookContent.deleteOne({ _id: orphan._id });
            await BookAnalytics.deleteOne({ book_mongo_id: orphan._id });
        }

        res.status(200).json({ status: 'success', message: 'Databases successfully synchronized.' });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: 'Failed to execute auto-repair.' });
    }
};

export const updateBookDetails = async (req: Request, res: Response): Promise<void> => {
    const bookId = Number(req.params.bookId);
    const { title, isbn, authorId, categoryId, synopsis, coverImage, totalCopies } = req.body;

    try {
        await mysqlPool.execute('CALL update_book(?, ?, ?, ?, ?)', [bookId, authorId, categoryId, title, isbn]);

        await BookContent.findOneAndUpdate(
            { mysql_book_id: bookId },
            { 
                synopsis: synopsis,
                cover_image_url: coverImage,
                'inventory.total_copies': totalCopies
            }
        );

        await safeAuditLog(req, 'BOOK_UPDATE', 'BOOK', bookId, `Updated details for book #${bookId}: "${title}"`);

        res.status(200).json({ status: 'success', message: 'Book updated successfully.' });
    } catch (error: any) {
        if (error.message.includes('Duplicate entry')) {
            res.status(400).json({ status: 'error', message: 'Update failed: ISBN already exists.' });
        } else {
            res.status(500).json({ status: 'error', message: error.message });
        }
    }
};

export const deleteBookRecord = async (req: Request, res: Response): Promise<void> => {
    const book_id = Number(req.params.bookId);

    try {
        const [bookRows]: any = await mysqlPool.execute('SELECT title FROM books WHERE book_id = ?', [book_id]);
        const bookTitle = bookRows[0]?.title || `ID #${book_id}`;

        const [activeLoans]: any = await mysqlPool.execute(
            'SELECT loan_id FROM loans WHERE book_id = ? AND return_date IS NULL',
            [book_id]
        );

        if (activeLoans.length > 0) {
            res.status(400).json({ 
                status: 'error', 
                message: 'Cannot archive: This book is currently borrowed by a member. Process the return first.' 
            });
            return;
        }

        const [unpaidFines]: any = await mysqlPool.execute(
            'SELECT f.fine_id FROM fines f JOIN loans l ON f.loan_id = l.loan_id WHERE l.book_id = ? AND f.is_paid = FALSE',
            [book_id]
        );

        if (unpaidFines.length > 0) {
            res.status(400).json({ 
                status: 'error', 
                message: 'Cannot archive: There are outstanding unpaid fines tied to this book.' 
            });
            return;
        }

        await mysqlPool.execute('CALL delete_book(?)', [book_id]);

        const mongoBook = await BookContent.findOneAndDelete({ mysql_book_id: book_id });
        if (mongoBook) {
            await BookAnalytics.deleteOne({ book_mongo_id: mongoBook._id });
        }

        await safeAuditLog(req, 'BOOK_ARCHIVE', 'BOOK', book_id, `Moved "${bookTitle}" to the 30-day archive vault.`);

        res.status(200).json({ status: 'success', message: 'Book securely moved to 30-day archive.' });
    } catch (error: any) {
        console.error('Archive Logic Error:', error.message);
        res.status(500).json({ status: 'error', message: 'Database error: ' + error.message });
    }
};

export const getArchivedBooks = async (req: Request, res: Response): Promise<void> => {
    try {
        const [rows]: any = await mysqlPool.execute(
            `SELECT archive_id, original_id, record_payload, 
                    DATE_FORMAT(archived_at, '%Y-%m-%d %H:%i') as archived_date,
                    DATE_FORMAT(DATE_ADD(archived_at, INTERVAL 30 DAY), '%Y-%m-%d') as deletion_date
             FROM books_archive 
             ORDER BY archived_at DESC`
        );
        
        res.status(200).json({ status: 'success', data: rows });
    } catch (error: any) {
        console.error('Fetch Archive Error:', error.message);
        res.status(500).json({ status: 'error', message: 'Failed to access the archive vault.' });
    }
};

export const restoreBookFromVault = async (req: Request, res: Response): Promise<void> => {
    const archiveId = Number(req.params.archiveId);

    try {
        const [arcRows]: any = await mysqlPool.execute('SELECT original_id, record_payload FROM books_archive WHERE archive_id = ?', [archiveId]);
        
        if (arcRows.length === 0) {
            res.status(404).json({ status: 'error', message: 'Archive record not found.' });
            return;
        }

        const payload = arcRows[0].record_payload;
        const originalId = arcRows[0].original_id;

        await mysqlPool.execute('CALL restore_book(?)', [archiveId]);

        await BookContent.create({
            mysql_book_id: originalId,
            synopsis: payload.synopsis || 'Recovered from archive.',
            cover_image_url: payload.cover_image_url || 'https://via.placeholder.com/300x450?text=Restored',
            inventory: { total_copies: 1, available_copies: 1 }
        });

        await safeAuditLog(req, 'BOOK_RESTORE', 'BOOK', originalId, `Restored book: "${payload.title}" from the vault.`);

        res.status(200).json({ status: 'success', message: 'Book successfully restored to the active catalog.' });
    } catch (error: any) {
        console.error('Restore Error:', error.message);
        res.status(500).json({ status: 'error', message: 'Failed to restore book.' });
    }
};

export const getAllAuthors = async (req: Request, res: Response): Promise<void> => {
    try {
        const [rows]: any = await mysqlPool.execute(
            'SELECT author_id, first_name, last_name, created_at FROM authors ORDER BY last_name ASC'
        );
        res.status(200).json({ status: 'success', data: rows });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch authors.' });
    }
};

export const updateAuthorRecord = async (req: Request, res: Response): Promise<void> => {
    const { authorId } = req.params;
    const { first_name, last_name } = req.body;
    try {
        await mysqlPool.execute('CALL update_author(?, ?, ?)', [authorId, first_name, last_name]);
        await safeAuditLog(req, 'AUTHOR_UPDATE', 'AUTHOR', authorId, `Updated author identity to: ${first_name} ${last_name}`);
        res.status(200).json({ status: 'success', message: 'Author updated successfully.' });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

export const deleteAuthorRecord = async (req: Request, res: Response): Promise<void> => {
    const { authorId } = req.params;
    try {
        const [authorRows]: any = await mysqlPool.execute('SELECT first_name, last_name FROM authors WHERE author_id = ?', [authorId]);
        const authorName = authorRows[0] ? `${authorRows[0].first_name} ${authorRows[0].last_name}` : `ID #${authorId}`;

        await mysqlPool.execute('DELETE FROM authors WHERE author_id = ?', [authorId]);
        await safeAuditLog(req, 'AUTHOR_ARCHIVE', 'AUTHOR', authorId, `Moved author "${authorName}" to the archive vault.`);

        res.status(200).json({ status: 'success', message: 'Author moved to 30-day archive.' });
    } catch (error: any) {
        if (error.message.includes('foreign key constraint')) {
            res.status(400).json({ 
                status: 'error', 
                message: 'Cannot archive: This author still has books in the catalog. Reassign or delete the books first.' 
            });
        } else {
            res.status(500).json({ status: 'error', message: 'Failed to archive author.' });
        }
    }
};

export const getArchivedAuthors = async (req: Request, res: Response): Promise<void> => {
    try {
        const [rows]: any = await mysqlPool.execute(
            `SELECT archive_id, original_id, record_payload, 
                    DATE_FORMAT(archived_at, '%Y-%m-%d %H:%i') as archived_date,
                    DATE_FORMAT(DATE_ADD(archived_at, INTERVAL 30 DAY), '%Y-%m-%d') as deletion_date
             FROM authors_archive 
             ORDER BY archived_at DESC`
        );
        
        res.status(200).json({ status: 'success', data: rows });
    } catch (error: any) {
        console.error('Fetch Author Archive Error:', error.message);
        res.status(500).json({ status: 'error', message: 'Failed to access the Author Vault.' });
    }
};

export const restoreAuthor = async (req: Request, res: Response): Promise<void> => {
    const archiveId = Number(req.params.archiveId);
    try {
        const [arcRows]: any = await mysqlPool.execute('SELECT original_id, record_payload FROM authors_archive WHERE archive_id = ?', [archiveId]);
        if (arcRows.length === 0) { res.status(404).json({ status: 'error', message: 'Not found.' }); return; }
        
        const payload = arcRows[0].record_payload;
        const originalId = arcRows[0].original_id;

        await mysqlPool.execute('CALL restore_author(?)', [archiveId]);
        await safeAuditLog(req, 'AUTHOR_RESTORE', 'AUTHOR', originalId, `Restored author "${payload.first_name} ${payload.last_name}" from archive.`);

        res.status(200).json({ status: 'success', message: 'Author successfully restored.' });
    } catch (error: any) {
        console.error('Author Restore Error:', error.message);
        res.status(500).json({ status: 'error', message: 'Failed to restore author.' });
    }
};

export const getAuditTrails = async (req: Request, res: Response): Promise<void> => {
    try {
        const { action, entity, search } = req.query;
        let query: any = {};

        if (action) query.action = action;
        if (entity) query.entity_type = entity;
        if (search) query.details = { $regex: search, $options: 'i' };

        const logs = await AuditLog.find(query).sort({ timestamp: -1 }).limit(100);
        
        res.status(200).json({ status: 'success', data: logs });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch audit trails.' });
    }
};