import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import mysqlPool from '../config/db-mysql';

export const getMemberDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const memberId = req.user.id; 
        const filter = req.query.filter || 'all';

        // 1. Call the SQL Function (Returns a scalar value)
        const [finesResult]: any = await mysqlPool.execute('SELECT get_member_total_fines(?) as totalFinesPaid', [memberId]);
        
        // 2. Call the SQL Procedures (Returns data tables)
        const [overdueResult]: any = await mysqlPool.execute('CALL get_member_overdue_books(?)', [memberId]);
        const [currentLoansResult]: any = await mysqlPool.execute('CALL get_member_current_loans(?)', [memberId]);
        const [historyResult]: any = await mysqlPool.execute('CALL get_member_history(?, ?)', [memberId, filter]);

        res.status(200).json({
            status: 'success',
            data: {
                totalFinesPaid: parseFloat(finesResult[0].totalFinesPaid),
                // Note: Stored procedures return arrays wrapped in arrays, so we grab the 0th index [0]
                overdueBooks: overdueResult[0],
                currentLoans: currentLoansResult[0],
                history: historyResult[0]
            }
        });

    } catch (error: any) {
        console.error('Dashboard Error:', error.message);
        res.status(500).json({ status: 'error', message: 'Failed to fetch tracking data.' });
    }
};