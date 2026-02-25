import { Request, Response } from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import mysqlPool from '../config/db-mysql';
// FIX: Added AuditLog to the imports here!
import { MemberProfile, TelemetryLog, BookContent, BookAnalytics, AuditLog } from '../models';

export const registerMember = async (req: Request, res: Response): Promise<void> => {
    const { firstName, lastName, email, phone, password } = req.body;
    const newMongoId = new mongoose.Types.ObjectId();
    const sessionId = (req.headers['x-session-id'] as string) || 'anonymous-session';

    try {
        await mysqlPool.execute(
            'CALL create_member(?, ?, ?, ?, ?, ?)',
            [newMongoId.toString(), password, firstName, lastName, email, phone]
        );

        const [rows]: any = await mysqlPool.execute(
            'SELECT member_id, username FROM members WHERE email = ? LIMIT 1',
            [email]
        );

        const memberData = rows[0];

        await MemberProfile.create({
            _id: newMongoId,
            mysql_member_id: memberData.member_id,
            ui_theme: 'light',
            reading_preferences: [],
            notification_settings: { email_alerts: true, sms_alerts: false }
        });

        await TelemetryLog.create({
            session_id: sessionId,
            member_mongo_id: newMongoId,
            event_type: 'UI_CLICK',
            search_query: 'Account Registration',
            device_info: req.headers['user-agent'] || 'Unknown Device',
            ip_address: req.ip || req.socket.remoteAddress || 'Unknown IP'
        });

        res.status(201).json({
            status: 'success',
            message: 'Member registered successfully.',
            data: {
                member_id: memberData.member_id,
                username: memberData.username,
                mongo_id: newMongoId
            }
        });
    } catch (error: any) {
        console.error('Registration Error:', error.message);
        res.status(400).json({
            status: 'error',
            message: 'Registration failed. Ensure password meets strict complexity requirements and email is unique.',
            database_error: error.message
        });
    }
};

export const loginMember = async (req: Request, res: Response): Promise<void> => {
    const { identifier, password } = req.body;
    const sessionId = (req.headers['x-session-id'] as string) || `sess_${Date.now()}`;

    try {
        const [rows]: any = await mysqlPool.execute('CALL get_member_auth(?)', [identifier]);
        const member = rows[0][0];

        if (!member || member.password !== password) {
            await TelemetryLog.create({
                session_id: sessionId,
                event_type: 'UI_CLICK',
                search_query: `FAILED_LOGIN_ATTEMPT: ${identifier}`,
                ip_address: req.ip || 'Unknown',
                device_info: req.headers['user-agent'] || 'Unknown'
            });

            res.status(401).json({ status: 'error', message: 'Invalid credentials.' });
            return;
        }

        if (!member.is_active) {
            res.status(403).json({ status: 'error', message: 'Account suspended. Contact librarian.' });
            return;
        }

        await TelemetryLog.create({
            session_id: sessionId,
            member_mongo_id: member.mongo_id,
            event_type: 'UI_CLICK',
            search_query: 'User Login Successful',
            ip_address: req.ip || 'Unknown',
            device_info: req.headers['user-agent'] || 'Unknown'
        });

        const token = jwt.sign(
            { id: member.member_id, role: member.role || 'member' },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '8h' }
        );

        res.status(200).json({
            status: 'success',
            message: 'Login successful.',
            session_id: sessionId,
            token,
            user: {
                id: member.member_id,
                username: member.username,
                email: member.email,
                mongo_id: member.mongo_id
            }
        });
    } catch (error: any) {
        console.error('Login Error:', error.message);
        res.status(500).json({ status: 'error', message: 'Internal server error during login.' });
    }
};

export const loginLibrarian = async (req: Request, res: Response): Promise<void> => {
    const identifier = String(req.body.identifier || '').trim();
    const password = String(req.body.password || '').trim();
    const sessionId = (req.headers['x-session-id'] as string) || `staff_sess_${Date.now()}`;

    try {
        const [rows]: any = await mysqlPool.execute('CALL get_librarian_auth(?)', [identifier]);
        const librarian = rows[0][0];

        if (!librarian || String(librarian.password).trim() !== password) {
            res.status(401).json({ status: 'error', message: 'Access Denied: Invalid Librarian credentials.' });
            return;
        }

        if (!librarian.is_active) {
            res.status(403).json({ status: 'error', message: 'Staff account deactivated.' });
            return;
        }

        const token = jwt.sign(
            { id: librarian.librarian_id, username: librarian.username, role: 'librarian' },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '8h' }
        );

        res.status(200).json({
            status: 'success',
            token,
            session_id: sessionId,
            user: { id: librarian.librarian_id, username: librarian.username, role: 'librarian' }
        });
    } catch (error: any) {
        console.error('Librarian Login Error:', error.message);
        res.status(500).json({ status: 'error', message: 'Internal server error.' });
    }
};

export const searchMembers = async (req: Request, res: Response): Promise<void> => {
    const keyword = (req.query.keyword as string) || '';

    try {
        const [rows]: any = await mysqlPool.execute('CALL search_members(?)', [keyword]);
        res.status(200).json({ status: 'success', data: rows[0] });
    } catch (error: any) {
        console.error('Search Members Error:', error.message);
        res.status(500).json({ status: 'error', message: 'Failed to search members.' });
    }
};

export const getDashboardData = async (req: Request, res: Response): Promise<void> => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) throw new Error('Unauthorized access');
        
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        const memberId = decoded.id; 
        const filter = (req.query.filter as string) || 'all';

        const [fines]: any = await mysqlPool.execute('SELECT get_member_total_fines(?) AS total', [memberId]);
        const [overdue]: any = await mysqlPool.execute('CALL get_member_overdue_books(?)', [memberId]);
        const [current]: any = await mysqlPool.execute('CALL get_member_current_loans(?)', [memberId]);
        const [history]: any = await mysqlPool.execute('CALL get_member_history(?, ?)', [memberId, filter]);

        res.status(200).json({
            status: 'success',
            data: {
                totalFinesPaid: parseFloat(fines[0].total || 0),
                overdueBooks: overdue[0],
                currentLoans: current[0],
                history: history[0]
            }
        });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

export const getAdminStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const [loansResult]: any = await mysqlPool.execute('SELECT COUNT(*) AS count FROM loans WHERE return_date IS NULL');
        const [finesResult]: any = await mysqlPool.execute('SELECT COALESCE(SUM(amount), 0) AS total FROM fines WHERE is_paid = FALSE');

        const [categoryResult]: any = await mysqlPool.execute(`
            SELECT c.category as name, COUNT(b.book_id) as value
            FROM books b
            JOIN categories c ON b.category_id = c.category_id
            GROUP BY c.category_id, c.category
            ORDER BY value DESC
        `);

        const inventoryResult = await BookContent.aggregate([{ $group: { _id: null, totalCopies: { $sum: "$inventory.total_copies" } } }]);
        const analyticsResult = await BookAnalytics.aggregate([{ $group: { _id: null, totalViews: { $sum: "$total_views" } } }]);

        const topSearches = await TelemetryLog.aggregate([
            { $match: { event_type: 'SEARCH_EXECUTED', search_query: { $ne: null } } },
            { $group: { _id: "$search_query", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        const fetchBookRankings = async (sortObj: any, matchObj: any = {}) => {
            return await BookAnalytics.aggregate([
                {
                    $addFields: {
                        true_conversion: {
                            $cond: [
                                { $gt: ["$total_views", 0] },
                                { $divide: ["$total_borrows", "$total_views"] },
                                0
                            ]
                        }
                    }
                },
                { $match: matchObj }, 
                { $sort: sortObj },
                { $limit: 5 },
                { $lookup: { from: 'bookcontents', localField: 'book_mongo_id', foreignField: '_id', as: 'content' } },
                { $unwind: '$content' },
                { $project: {
                    mysql_book_id: '$content.mysql_book_id',
                    total_views: 1,
                    total_borrows: 1,
                    conversion_rate: '$true_conversion', 
                    avg_return_time_days: 1
                } }
            ]);
        };

        const topViewedMongo = await fetchBookRankings({ total_views: -1 });
        const topBorrowedMongo = await fetchBookRankings({ total_borrows: -1 });

        const lowConversionMongo = await fetchBookRankings(
            { true_conversion: 1, total_views: -1 },
            {
                total_views: { $gte: 1 },
                true_conversion: { $lt: 0.25 }
            }
        );

        const extractIds = (arr: any[]) => arr.map(item => item.mysql_book_id);
        const allNeededIds = [...new Set([ ...extractIds(topViewedMongo), ...extractIds(topBorrowedMongo), ...extractIds(lowConversionMongo) ])];

        let titleMap: Record<number, string> = {};
        if (allNeededIds.length > 0) {
            const placeholders = allNeededIds.map(() => '?').join(',');
            const [bookTitles]: any = await mysqlPool.execute(`SELECT book_id, title FROM books WHERE book_id IN (${placeholders})`, allNeededIds);
            bookTitles.forEach((b: any) => { titleMap[b.book_id] = b.title; });
        }

        const mapTitles = (arr: any[]) => arr.map(item => ({ ...item, title: titleMap[item.mysql_book_id] || 'Unknown Book' }));

        res.status(200).json({
            status: 'success',
            data: {
                activeLoans: loansResult[0].count,
                unpaidFines: parseFloat(finesResult[0].total),
                totalBooks: inventoryResult.length > 0 ? inventoryResult[0].totalCopies : 0,
                systemViews: analyticsResult.length > 0 ? analyticsResult[0].totalViews : 0,
                categoryDistribution: categoryResult,
                topSearches: topSearches.map(s => ({ 
                    query: s._id.split('|')[0].replace('keyword:', '') || "Empty Search",
                    count: s.count 
                })),
                topViewed: mapTitles(topViewedMongo),
                topBorrowed: mapTitles(topBorrowedMongo),
                lowConversion: mapTitles(lowConversionMongo)
            }
        });
    } catch (error: any) {
        console.error('Admin Stats Error:', error.message);
        res.status(500).json({ status: 'error', message: 'Failed to fetch dashboard statistics.' });
    }
};

export const getAllMembers = async (req: Request, res: Response): Promise<void> => {
    try {
        const [rows]: any = await mysqlPool.execute(
            'SELECT member_id, username, first_name, last_name, email, phone_number, is_active, created_at FROM members ORDER BY created_at DESC'
        );
        res.status(200).json({ status: 'success', data: rows });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch member directory.' });
    }
};

export const updateMemberDetails = async (req: Request, res: Response): Promise<void> => {
    const { memberId } = req.params;
    const { first_name, last_name, email, phone_number, password } = req.body;

    try {
        const rawPw = (password && password.trim() !== "") ? password : null;
        await mysqlPool.execute('CALL update_member(?, ?, ?, ?, ?, ?)', 
            [memberId, first_name, last_name, email, phone_number, rawPw]
        );
        res.status(200).json({ status: 'success', message: 'Member profile updated (Plain Text).' });
    } catch (error: any) {
        if (error.message.includes('Duplicate entry')) {
            res.status(400).json({ status: 'error', message: 'Email address already in use.' });
        } else {
            res.status(500).json({ status: 'error', message: 'Failed to update member.' });
        }
    }
};

// FIX: Only ONE toggleMemberStatus function, with safe audit logging
export const toggleMemberStatus = async (req: Request, res: Response): Promise<void> => {
    const { memberId } = req.params;
    const { status } = req.body; 

    try {
        // Fetch previous status so we can capture before/after in the audit log
        const [prevRows]: any = await mysqlPool.execute(
            'SELECT is_active FROM members WHERE member_id = ? LIMIT 1',
            [memberId]
        );
        const previous = prevRows[0] || { is_active: null };

        await mysqlPool.execute(
            'UPDATE members SET is_active = ? WHERE member_id = ?',
            [status ? 1 : 0, memberId]
        );
        const message = status ? 'Member account reactivated.' : 'Member account suspended.';

        try {
            const user = (req as any).user || { id: 999, username: 'System_Admin' };

            const meta = {
                ip: req.ip || (req.socket && req.socket.remoteAddress) || 'unknown',
                method: req.method,
                path: (req as any).originalUrl || req.url,
                userAgent: req.headers['user-agent'] || 'Unknown UA'
            };

            await AuditLog.create({
                librarian_id: user.id || 999,
                username: user.username || 'System_Admin',
                action: status ? 'MEMBER_RESTORE' : 'MEMBER_ARCHIVE',
                entity_type: 'MEMBER',
                entity_id: String(memberId),
                details: JSON.stringify({
                    message,
                    before: { is_active: previous.is_active },
                    after: { is_active: status ? 1 : 0 },
                    meta
                })
            });
        } catch (auditErr) {
            console.error("Non-fatal Audit Error:", auditErr);
        }

        res.status(200).json({ status: 'success', message });
    } catch (error: any) {
        console.error('Status Toggle Error:', error.message);
        res.status(500).json({ status: 'error', message: 'Failed to update member status.' });
    }
};