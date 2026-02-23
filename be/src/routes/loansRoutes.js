import express from 'express';
import { mysqlPool } from '../config/db.js';

const router = express.Router();

// GET /api/loans - List all loans with member/book info, optional search
router.get('/', async (req, res, next) => {
  try {
    const { q, status } = req.query;
    let query = `
      SELECT l.loan_id, l.member_id, l.book_id, l.librarian_id,
             l.borrowed_at, l.due_date, l.returned_at,
             CONCAT(m.first_name, ' ', m.last_name) AS member_name,
             b.title AS book_title, b.isbn,
             CONCAT(lib.first_name, ' ', lib.last_name) AS librarian_name,
             CASE
               WHEN l.returned_at IS NOT NULL THEN 'Returned'
               WHEN l.due_date < CURDATE() THEN 'Overdue'
               ELSE 'Active'
             END AS status
      FROM loans l
      JOIN members m ON l.member_id = m.member_id
      JOIN books b ON l.book_id = b.book_id
      LEFT JOIN librarians lib ON l.librarian_id = lib.librarian_id
    `;
    const conditions = [];
    const params = [];

    if (q) {
      conditions.push(`(m.first_name LIKE ? OR m.last_name LIKE ? OR CONCAT(m.first_name, ' ', m.last_name) LIKE ? OR b.title LIKE ? OR b.isbn LIKE ?)`);
      const term = `%${q}%`;
      params.push(term, term, term, term, term);
    }

    const statusNorm = (typeof status === 'string' && status.trim()) ? status.trim().toLowerCase() : '';
    if (statusNorm === 'active') {
      conditions.push('l.returned_at IS NULL');
    } else if (statusNorm === 'returned') {
      conditions.push('l.returned_at IS NOT NULL');
    } else if (statusNorm === 'overdue') {
      conditions.push('l.returned_at IS NULL AND l.due_date < CURDATE()');
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY l.borrowed_at DESC';

    const [rows] = await mysqlPool.query(query, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/loans - Create a new loan and return receipt data
// Matches your DB: borrow logic in API so we can set librarian_id (required) and due_date.
// Procedure borrow(p_member_id, p_book_id, p_due_date) does not set librarian_id; loans.librarian_id is NOT NULL.
router.post('/', async (req, res, next) => {
  try {
    const { member_id, book_id, librarian_id } = req.body || {};
    if (member_id == null || book_id == null) {
      return res.status(400).json({ status: 'error', message: 'member_id and book_id are required.' });
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    const dueDateStr = dueDate.toISOString().slice(0, 10); // YYYY-MM-DD
    const libId = librarian_id != null ? librarian_id : 1;

    // Check book status (same as borrow procedure)
    const [[bookRow]] = await mysqlPool.query(
      'SELECT status FROM books WHERE book_id = ?',
      [book_id]
    );
    if (!bookRow) {
      return res.status(400).json({ status: 'error', message: 'Book not found.' });
    }
    if (bookRow.status !== 'Available') {
      return res.status(400).json({ status: 'error', message: 'Book is not available for borrowing' });
    }

    // Enforce max 5 active loans per member (same as trg_limit_active_loans)
    const [[countRow]] = await mysqlPool.query(
      'SELECT COUNT(*) AS n FROM loans WHERE member_id = ? AND returned_at IS NULL',
      [member_id]
    );
    if (countRow.n >= 5) {
      return res.status(400).json({ status: 'error', message: 'Error: Member has reached max limit of 5 loans' });
    }

    // Insert loan (trg_after_borrow will set book status to Borrowed)
    await mysqlPool.query(
      `INSERT INTO loans (member_id, book_id, librarian_id, borrowed_at, due_date)
       VALUES (?, ?, ?, NOW(), ?)`,
      [member_id, book_id, libId, dueDateStr]
    );

    // Fetch the newly created loan for receipt
    const [loans] = await mysqlPool.query(
      `SELECT l.loan_id, l.borrowed_at, l.due_date,
              m.first_name AS member_first, m.last_name AS member_last, m.member_id,
              b.title AS book_title, b.isbn, b.book_id,
              CONCAT(lib.first_name, ' ', lib.last_name) AS librarian_name
       FROM loans l
       JOIN members m ON l.member_id = m.member_id
       JOIN books b ON l.book_id = b.book_id
       LEFT JOIN librarians lib ON l.librarian_id = lib.librarian_id
       WHERE l.member_id = ? AND l.book_id = ? AND l.returned_at IS NULL
       ORDER BY l.loan_id DESC LIMIT 1`,
      [member_id, book_id]
    );

    const row = loans.length > 0 ? loans[0] : null;
    const receipt = row ? {
      loan_id: row.loan_id,
      member_name: `${row.member_first || ''} ${row.member_last || ''}`.trim(),
      book_title: row.book_title || '',
      isbn: row.isbn || '',
      borrowed_at: row.borrowed_at,
      due_date: row.due_date,
    } : null;

    res.status(201).json({
      status: 'ok',
      message: 'Loan processed successfully.',
      loan_id: receipt?.loan_id,
      receipt,
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/loans/:id/return - Mark loan as returned
// Your schema has no return_item procedure; triggers use return_date but table has returned_at.
// We update returned_at, then set book back to Available and create fine if overdue.
router.put('/:id/return', async (req, res, next) => {
  try {
    const loanId = req.params.id;

    const [updateResult] = await mysqlPool.query(
      'UPDATE loans SET returned_at = NOW() WHERE loan_id = ? AND returned_at IS NULL',
      [loanId]
    );
    if (updateResult.affectedRows === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Loan not found or already returned.',
      });
    }

    const [[loan]] = await mysqlPool.query(
      'SELECT book_id, due_date, returned_at FROM loans WHERE loan_id = ?',
      [loanId]
    );
    if (loan) {
      await mysqlPool.query('UPDATE books SET status = ? WHERE book_id = ?', ['Available', loan.book_id]);
      await mysqlPool.query(
        `INSERT INTO fines (loan_id, amount)
         SELECT loan_id, calculate_fine(due_date, returned_at)
         FROM loans WHERE loan_id = ? AND returned_at > due_date`,
        [loanId]
      );
    }

    const [fines] = await mysqlPool.query(
      'SELECT fine_id, amount, is_paid FROM fines WHERE loan_id = ? ORDER BY fine_id DESC LIMIT 1',
      [loanId]
    );

    res.json({
      status: 'ok',
      message: 'Return processed successfully.',
      fine: fines.length > 0 ? fines[0] : null,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
