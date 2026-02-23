import express from 'express';
import { mysqlPool } from '../config/db.js';
import UserTelemetryLog from '../models/UserTelemetryLog.js';

const router = express.Router();

// GET /api/dashboard/stats - Aggregated dashboard statistics
router.get('/stats', async (req, res, next) => {
  try {
    const [[bookCount]] = await mysqlPool.query('SELECT COUNT(*) AS total FROM books');
    const [[memberCount]] = await mysqlPool.query('SELECT COUNT(*) AS total FROM members');
    const [[activeLoans]] = await mysqlPool.query('SELECT COUNT(*) AS total FROM loans WHERE returned_at IS NULL');
    const [[unpaidFines]] = await mysqlPool.query('SELECT COALESCE(SUM(amount), 0) AS total FROM fines WHERE is_paid = FALSE');
    const [[overdueLoans]] = await mysqlPool.query(
      'SELECT COUNT(*) AS total FROM loans WHERE returned_at IS NULL AND due_date < CURDATE()'
    );
    const [[todayLoans]] = await mysqlPool.query(
      'SELECT COUNT(*) AS total FROM loans WHERE DATE(borrowed_at) = CURDATE()'
    );

    res.json({
      total_books: bookCount.total,
      total_members: memberCount.total,
      active_loans: activeLoans.total,
      unpaid_fines: Number(unpaidFines.total),
      overdue_loans: overdueLoans.total,
      today_loans: todayLoans.total,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/analytics - Book view counts (MongoDB), borrow counts (MySQL), average return time (MySQL)
router.get('/analytics', async (req, res, next) => {
  try {
    const [viewCounts, [borrowRows], [avgReturnRows]] = await Promise.all([
      UserTelemetryLog.aggregate([
        { $match: { event_type: { $in: ['VIEW_BOOK', 'VIEW_DETAILS'] } } },
        {
          $addFields: {
            bookId: { $ifNull: ['$payload.bookId', '$payload.book_id'] },
          },
        },
        { $match: { bookId: { $exists: true, $ne: null } } },
        { $group: { _id: '$bookId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      mysqlPool.query('SELECT book_id, COUNT(*) AS count FROM loans GROUP BY book_id'),
      mysqlPool.query(
        'SELECT ROUND(AVG(DATEDIFF(returned_at, borrowed_at)), 1) AS avg_days FROM loans WHERE returned_at IS NOT NULL'
      ),
    ]);

    const bookViewCounts = viewCounts
      .map((doc) => {
        const rawId = doc._id;
        const bookId = typeof rawId === 'number' && !Number.isNaN(rawId)
          ? rawId
          : parseInt(String(rawId), 10);
        if (Number.isNaN(bookId)) return null;
        return { bookId, count: doc.count };
      })
      .filter(Boolean);

    if (bookViewCounts.length > 0) {
      const ids = bookViewCounts.map((v) => v.bookId).join(',');
      const [titleRows] = await mysqlPool.query(
        `SELECT book_id, title FROM books WHERE book_id IN (${ids})`
      );

      const titleByBookId = Object.fromEntries(
        (titleRows || []).map((r) => [r.book_id, r.title])
      );

      bookViewCounts.forEach((v) => {
        v.title = titleByBookId[v.bookId] ?? null;
      });
    }

    const bookBorrowCounts = (borrowRows || []).map((row) => ({
      book_id: Number(row.book_id),
      count: Number(row.count),
    }));

    const avgRow = Array.isArray(avgReturnRows) ? avgReturnRows[0] : null;
    const averageReturnTimeDays = avgRow?.avg_days != null ? Number(avgRow.avg_days) : null;

    res.json({
      bookViewCounts,
      bookBorrowCounts,
      averageReturnTimeDays,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/popular-books - Most borrowed books this month (bar chart)
router.get('/popular-books', async (req, res, next) => {
  try {
    const [rows] = await mysqlPool.query(`
      SELECT b.title, COUNT(*) AS borrow_count
      FROM loans l
      JOIN books b ON l.book_id = b.book_id
      WHERE l.borrowed_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
      GROUP BY b.book_id, b.title
      ORDER BY borrow_count DESC
      LIMIT 10
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/loan-activity - Loan activity over last 14 days (line chart)
router.get('/loan-activity', async (req, res, next) => {
  try {
    const [rows] = await mysqlPool.query(`
      SELECT DATE(borrowed_at) AS date, COUNT(*) AS count
      FROM loans
      WHERE borrowed_at >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
      GROUP BY DATE(borrowed_at)
      ORDER BY date
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/category-distribution - Book count by category (pie/donut)
router.get('/category-distribution', async (req, res, next) => {
  try {
    const [rows] = await mysqlPool.query(`
      SELECT c.category AS name, COUNT(*) AS value
      FROM books b
      JOIN categories c ON b.category_id = c.category_id
      GROUP BY c.category_id, c.category
      ORDER BY value DESC
      LIMIT 8
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

export default router;
