import { Request, Response } from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import mysqlPool from '../config/db-mysql';
import { MemberProfile, TelemetryLog } from '../models';
import { BookContent, BookAnalytics } from '../models';

export const registerMember = async (req: Request, res: Response): Promise<void> => {
    const { firstName, lastName, email, phone, password } = req.body;

    // 1. Generate a new MongoDB ObjectId ahead of time
    const newMongoId = new mongoose.Types.ObjectId();
    const sessionId = (req.headers['x-session-id'] as string) || 'anonymous-session';

    try {
        // 2. Execute the ACID-Compliant MySQL Stored Procedure
        // If the password fails the Regex, or email is a duplicate, MySQL throws an error here and stops execution.
        await mysqlPool.execute(
            'CALL create_member(?, ?, ?, ?, ?, ?)',
            [newMongoId.toString(), password, firstName, lastName, email, phone]
        );

        // 3. Fetch the newly generated MySQL member_id and auto-generated username
        const [rows]: any = await mysqlPool.execute(
            'SELECT member_id, username FROM members WHERE email = ? LIMIT 1',
            [email]
        );

        const memberData = rows[0];

        // 4. Create the NoSQL Member Profile in MongoDB
        await MemberProfile.create({
            _id: newMongoId,
            mysql_member_id: memberData.member_id,
            ui_theme: 'light',
            reading_preferences: [],
            notification_settings: { email_alerts: true, sms_alerts: false }
        });

        // 5. Log the successful registration in our Telemetry engine
        await TelemetryLog.create({
            session_id: sessionId,
            member_mongo_id: newMongoId,
            event_type: 'UI_CLICK',
            search_query: 'Account Registration',
            device_info: req.headers['user-agent'] || 'Unknown Device',
            ip_address: req.ip || req.socket.remoteAddress || 'Unknown IP'
        });

        // 6. Return the success payload to the Frontend
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
        // If MySQL throws a regex constraint or duplicate error, we catch it and send it to the frontend cleanly
        console.error('Registration Error:', error.message);
        res.status(400).json({
            status: 'error',
            message: 'Registration failed. Ensure password meets strict complexity requirements and email is unique.',
            database_error: error.message
        });
    }
};

export const loginMember = async (req: Request, res: Response): Promise<void> => {
    const { identifier, password } = req.body; // identifier can be username or email
    const sessionId = (req.headers['x-session-id'] as string) || `sess_${Date.now()}`;

    try {
        // 1. Call MySQL Stored Procedure to fetch auth data safely
        const [rows]: any = await mysqlPool.execute('CALL get_member_auth(?)', [identifier]);

        // MySQL Stored Procedures return an array of arrays. The actual data is in rows[0][0]
        const member = rows[0][0];

        // 2. Security Check: Does user exist and is the password correct?
        if (!member || member.password !== password) {
            // Log failed attempt in MongoDB for security auditing
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

        // 3. Status Check: Is the account suspended?
        if (!member.is_active) {
            res.status(403).json({ status: 'error', message: 'Account suspended. Contact librarian.' });
            return;
        }

        // 4. Success: Log the successful login session in MongoDB Telemetry
        await TelemetryLog.create({
            session_id: sessionId,
            member_mongo_id: member.mongo_id,
            event_type: 'UI_CLICK',
            search_query: 'User Login Successful',
            ip_address: req.ip || 'Unknown',
            device_info: req.headers['user-agent'] || 'Unknown'
        });

        // 5. Generate JWT token for authenticated sessions
        const token = jwt.sign(
            { id: member.member_id, role: member.role || 'member' },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '8h' }
        );

        // 6. Respond with user data (excluding password for the frontend)
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
    // Trim inputs to remove hidden spaces from copy-pasting
    const identifier = String(req.body.identifier || '').trim();
    const password = String(req.body.password || '').trim();
    const sessionId = (req.headers['x-session-id'] as string) || `staff_sess_${Date.now()}`;

    try {
        const [rows]: any = await mysqlPool.execute('CALL get_librarian_auth(?)', [identifier]);
        
        // In mysql2, the result of a CALL is an array of result sets. 
        // rows[0] is the array containing our user row.
        const librarian = rows[0][0];

        // DEBUG LOG: Check your terminal after trying to login!
        console.log(`Login attempt for: ${identifier}. Match found: ${!!librarian}`);

        if (!librarian || String(librarian.password).trim() !== password) {
            res.status(401).json({ status: 'error', message: 'Access Denied: Invalid Librarian credentials.' });
            return;
        }

        if (!librarian.is_active) {
            res.status(403).json({ status: 'error', message: 'Staff account deactivated.' });
            return;
        }

        const token = jwt.sign(
            { id: librarian.librarian_id, role: 'librarian' },
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
        // Execute the exact MySQL procedure you provided
        const [rows]: any = await mysqlPool.execute('CALL search_members(?)', [keyword]);
        
        res.status(200).json({ 
            status: 'success', 
            data: rows[0] // Stored procedures return arrays within arrays
        });
    } catch (error: any) {
        console.error('Search Members Error:', error.message);
        res.status(500).json({ status: 'error', message: 'Failed to search members.' });
    }
};

export const getDashboardData = async (req: Request, res: Response): Promise<void> => {
    try {
        // Extract the logged-in Member's ID securely from their JWT token
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) throw new Error('Unauthorized access');
        
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        const memberId = decoded.id; 
        const filter = (req.query.filter as string) || 'all';

        // Fire all 4 Dashboard MySQL Procedures concurrently!
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
        // 1. Fire MySQL Queries
        const [loansResult]: any = await mysqlPool.execute('SELECT COUNT(*) AS count FROM loans WHERE return_date IS NULL');
        const [finesResult]: any = await mysqlPool.execute('SELECT COALESCE(SUM(amount), 0) AS total FROM fines WHERE is_paid = FALSE');

        // 2. Fire MongoDB Queries (Inventory & Analytics)
        const inventoryResult = await BookContent.aggregate([{ $group: { _id: null, totalCopies: { $sum: "$inventory.total_copies" } } }]);
        const analyticsResult = await BookAnalytics.aggregate([{ $group: { _id: null, totalViews: { $sum: "$total_views" } } }]);

        // 3. ADVANCED MONGODB ANALYTICS
        const topSearches = await TelemetryLog.aggregate([
            { $match: { event_type: 'SEARCH_EXECUTED', search_query: { $ne: null } } },
            { $group: { _id: "$search_query", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        // FIX: The Dynamic Conversion Rate Calculation Pipeline
        const fetchBookRankings = async (sortObj: any, matchObj: any = {}) => {
            return await BookAnalytics.aggregate([
                {
                    // Calculate conversion rate dynamically on-the-fly!
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
                { $match: matchObj }, // Now filter using the true math
                { $sort: sortObj },
                { $limit: 5 },
                { $lookup: { from: 'bookcontents', localField: 'book_mongo_id', foreignField: '_id', as: 'content' } },
                { $unwind: '$content' },
                { $project: {
                    mysql_book_id: '$content.mysql_book_id',
                    total_views: 1,
                    total_borrows: 1,
                    conversion_rate: '$true_conversion', // Replace the stuck 0.0 with the real math!
                    avg_return_time_days: 1
                } }
            ]);
        };

        // B. Top Viewed, Top Borrowed, and High-View/Low-Borrow
        const topViewedMongo = await fetchBookRankings({ total_views: -1 });
        const topBorrowedMongo = await fetchBookRankings({ total_borrows: -1 });

        // Apply the strict 25% threshold against the dynamic 'true_conversion' field
        const lowConversionMongo = await fetchBookRankings(
            { true_conversion: 1, total_views: -1 },
            {
                total_views: { $gte: 1 },
                true_conversion: { $lt: 0.25 }
            }
        );

        // 4. CROSS-REFERENCE MYSQL FOR TITLES
        const extractIds = (arr: any[]) => arr.map(item => item.mysql_book_id);
        const allNeededIds = [...new Set([ ...extractIds(topViewedMongo), ...extractIds(topBorrowedMongo), ...extractIds(lowConversionMongo) ])];

        let titleMap: Record<number, string> = {};
        if (allNeededIds.length > 0) {
            const placeholders = allNeededIds.map(() => '?').join(',');
            const [bookTitles]: any = await mysqlPool.execute(`SELECT book_id, title FROM books WHERE book_id IN (${placeholders})`, allNeededIds);
            bookTitles.forEach((b: any) => { titleMap[b.book_id] = b.title; });
        }

        const mapTitles = (arr: any[]) => arr.map(item => ({ ...item, title: titleMap[item.mysql_book_id] || 'Unknown Book' }));

        // 5. Package and send
        res.status(200).json({
            status: 'success',
            data: {
                activeLoans: loansResult[0].count,
                unpaidFines: parseFloat(finesResult[0].total),
                totalBooks: inventoryResult.length > 0 ? inventoryResult[0].totalCopies : 0,
                systemViews: analyticsResult.length > 0 ? analyticsResult[0].totalViews : 0,
                topSearches: topSearches.map(s => ({ query: s._id, count: s.count })),
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