import { Request, Response } from 'express';
import { BookAnalytics, TelemetryLog } from '../models';

export const getLibraryStats = async (req: Request, res: Response): Promise<void> => {
    try {
        // 1. Get Top 5 Most Viewed Books
        const topViewed = await BookAnalytics.find()
            .sort({ total_views: -1 })
            .limit(5)
            .populate({ path: 'book_mongo_id', select: 'mysql_book_id' });

        // 2. Get Top 5 Most Borrowed Books
        const topBorrowed = await BookAnalytics.find()
            .sort({ total_borrows: -1 })
            .limit(5);

        // 3. Find "Hidden Gems" (High Views but Low Borrows)
        // Logic: Views > 5 and Conversion Rate < 0.1
        const hiddenGems = await BookAnalytics.find({
            total_views: { $gt: 5 },
            conversion_rate: { $lt: 0.1 }
        }).limit(5);

        // 4. Most Common Search Queries
        const commonSearches = await TelemetryLog.aggregate([
            { $match: { event_type: 'SEARCH_EXECUTED' } },
            { $group: { _id: '$search_query', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // 5. Global Average Return Time
        const returnStats = await BookAnalytics.aggregate([
            { $unwind: '$return_durations' },
            { $group: { _id: null, avgTime: { $avg: '$return_durations' } } }
        ]);

        res.status(200).json({
            status: 'success',
            data: {
                popularBooks: { topViewed, topBorrowed },
                funnelAnalysis: { hiddenGems },
                trends: { commonSearches },
                efficiency: { globalAvgReturnDays: returnStats[0]?.avgTime || 0 }
            }
        });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

