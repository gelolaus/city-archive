import express from 'express';
import { mysqlPool } from '../config/db.js';

const router = express.Router();

router.get('/stats', async (req, res, next) => {
  try {
    const [membersRow] = await mysqlPool.query('SELECT COUNT(*) AS count FROM members');
    const [booksRow] = await mysqlPool.query('SELECT COUNT(*) AS count FROM books');
    const [activeLoansRow] = await mysqlPool.query(
      'SELECT COUNT(*) AS count FROM loans WHERE return_date IS NULL'
    );
    const [overdueRow] = await mysqlPool.query(
      'SELECT COUNT(*) AS count FROM loans WHERE return_date IS NULL AND due_date < CURDATE()'
    );
    const [finesPaidRow] = await mysqlPool.query(
      'SELECT COALESCE(SUM(amount), 0) AS total FROM fines WHERE is_paid = TRUE'
    );
    const [finesUnpaidRow] = await mysqlPool.query(
      'SELECT COALESCE(SUM(amount), 0) AS total FROM fines WHERE is_paid = FALSE'
    );
    const [categoryRows] = await mysqlPool.query(`
      SELECT COALESCE(c.category, 'Uncategorized') AS category_name, COUNT(b.book_id) AS count
      FROM books b
      LEFT JOIN categories c ON b.category_id = c.category_id
      GROUP BY c.category_id, c.category
      ORDER BY count DESC
    `);
    const [statusRows] = await mysqlPool.query(`
      SELECT status, COUNT(*) AS count FROM books GROUP BY status
    `);

    const total_members = Number(membersRow[0]?.count ?? 0);
    const total_books = Number(booksRow[0]?.count ?? 0);
    const active_loans = Number(activeLoansRow[0]?.count ?? 0);
    const overdue_books = Number(overdueRow[0]?.count ?? 0);
    const total_fines_paid = Number(finesPaidRow[0]?.total ?? 0);
    const total_fines_unpaid = Number(finesUnpaidRow[0]?.total ?? 0);
    const category_breakdown = (categoryRows || []).map((r) => ({
      category_name: r.category_name,
      count: Number(r.count ?? 0),
    }));
    const loan_status_breakdown = (statusRows || []).map((r) => ({
      status: r.status,
      count: Number(r.count ?? 0),
    }));

    res.json({
      total_members,
      total_books,
      active_loans,
      overdue_books,
      total_fines_paid,
      total_fines_unpaid,
      category_breakdown,
      loan_status_breakdown,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
