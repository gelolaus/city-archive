import { Request, Response } from 'express';
import { BookAnalytics, TelemetryLog } from '../models';
import mysqlPool from '../config/db-mysql';

export const getLibraryStats = async (req: Request, res: Response): Promise<void> => {
    try {
        // --- 1. MONGODB Behavioral Data (Views & Trends) ---
        const topViewedRaw = await BookAnalytics.find()
            .sort({ total_views: -1 })
            .limit(5)
            .populate({ path: 'book_mongo_id', select: 'mysql_book_id' });

        const commonSearches = await TelemetryLog.aggregate([
            { $match: { event_type: 'SEARCH_EXECUTED' } },
            { $group: { _id: '$search_query', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        const hiddenGemsRaw = await BookAnalytics.find({
            total_views: { $gt: 5 },
            total_borrows: { $eq: 0 }
        }).limit(5).populate({ path: 'book_mongo_id', select: 'mysql_book_id' });

        // --- 2. MYSQL Transactional Data (Borrows & Efficiency) ---

        // We use a sentinel value (-1) for books that have ZERO returns to distinguish from same-day returns
        const [mysqlStats]: any = await mysqlPool.execute(`
            SELECT 
                b.book_id,
                b.title, 
                COUNT(l.loan_id) as total_borrows,
                COALESCE(
                    ROUND(
                        AVG(
                            CASE WHEN l.return_date IS NOT NULL 
                            THEN DATEDIFF(l.return_date, l.checkout_date) 
                            ELSE NULL END
                        ), 1
                    ), -1
                ) as avgReturnTime
            FROM books b
            LEFT JOIN loans l ON b.book_id = l.book_id
            GROUP BY b.book_id, b.title
            ORDER BY total_borrows DESC
        `);

        const [globalEfficiencyRows]: any = await mysqlPool.execute(`
            SELECT COALESCE(ROUND(AVG(DATEDIFF(return_date, checkout_date)), 1), 0) as globalAvg 
            FROM loans 
            WHERE return_date IS NOT NULL
        `);
        const globalAvg = globalEfficiencyRows[0]?.globalAvg || 0;

        // --- 3. DATA ENRICHMENT ---

        const topViewed = topViewedRaw.map(v => {
            const sqlBook = mysqlStats.find((s: any) => s.book_id === (v.book_mongo_id as any)?.mysql_book_id);
            return {
                title: sqlBook?.title || "Unknown Book",
                views: v.total_views,
                conversionRate: v.conversion_rate
            };
        });

        const hiddenGems = hiddenGemsRaw.map(g => {
            const sqlBook = mysqlStats.find((s: any) => s.book_id === (g.book_mongo_id as any)?.mysql_book_id);
            return {
                title: sqlBook?.title || "Catalog Item",
                views: g.total_views,
                borrows: 0
            };
        });

        const topBorrowed = mysqlStats.slice(0, 5).map((s: any) => {
            let returnText = "N/A";
            
            // LOGIC: 
            // -1 = Never returned
            // 0  = Same day return
            // >0 = Average days
            if (s.avgReturnTime > 0) {
                returnText = `${s.avgReturnTime} days`;
            } else if (s.avgReturnTime === 0) {
                returnText = "Same Day";
            }

            return {
                title: s.title,
                borrows: s.total_borrows,
                avgReturnDays: returnText
            };
        });

        // --- 4. FINAL RESPONSE ---
        res.status(200).json({
            status: 'success',
            data: {
                popularBooks: { topViewed, topBorrowed },
                funnelAnalysis: { hiddenGems },
                trends: { commonSearches },
                efficiency: { 
                    globalAvgReturnDays: globalAvg,
                    performanceMetric: "Relational + NoSQL Aggregation V2 Complete"
                }
            }
        });

    } catch (error: any) {
        console.error('Analytics Engine Error:', error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
};