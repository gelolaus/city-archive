import express from 'express';
import { mysqlPool } from '../config/db.js';

const router = express.Router();

router.post('/borrow', async (req, res, next) => {
  try {
    const { member_id, book_id, librarian_id } = req.body || {};
    if (member_id == null || book_id == null) {
      return res.status(400).json({ status: 'error', message: 'member_id and book_id are required.' });
    }
    await mysqlPool.query('CALL borrow(?, ?, ?)', [member_id, book_id, librarian_id ?? null]);
    res.json({ status: 'ok', message: 'Borrow successful.' });
  } catch (err) {
    next(err);
  }
});

router.post('/return', async (req, res, next) => {
  try {
    const { loan_id } = req.body || {};
    if (loan_id == null) {
      return res.status(400).json({ status: 'error', message: 'loan_id is required.' });
    }
    await mysqlPool.query('CALL return_item(?)', [loan_id]);
    const [fineRows] = await mysqlPool.query(
      'SELECT amount FROM fines WHERE loan_id = ? ORDER BY fine_id DESC LIMIT 1',
      [loan_id]
    );
    const fine_amount = fineRows.length > 0 ? Number(fineRows[0].amount) : undefined;
    res.json({ status: 'ok', message: 'Return successful.', ...(fine_amount != null && { fine_amount }) });
  } catch (err) {
    next(err);
  }
});

export default router;
