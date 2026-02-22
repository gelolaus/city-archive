import express from 'express';
import { mysqlPool } from '../config/db.js';

const router = express.Router();

const unpaidQuery = `
  SELECT f.fine_id, f.loan_id, f.amount, f.is_paid,
    CONCAT(m.first_name, ' ', m.last_name) AS member_name
  FROM fines f
  INNER JOIN loans l ON l.loan_id = f.loan_id
  INNER JOIN members m ON m.member_id = l.member_id
  WHERE f.is_paid = FALSE
`;

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await mysqlPool.query(unpaidQuery);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/unpaid', async (req, res, next) => {
  try {
    const [rows] = await mysqlPool.query(unpaidQuery);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

async function settleFine(fine_id) {
  const [result] = await mysqlPool.query(
    'UPDATE fines SET is_paid = TRUE WHERE fine_id = ?',
    [fine_id]
  );
  if (result.affectedRows === 0) {
    return null;
  }
  return { status: 'ok', message: 'Fine settled.' };
}

router.put('/settle/:fine_id', async (req, res, next) => {
  try {
    const { fine_id } = req.params;
    const payload = await settleFine(fine_id);
    if (!payload) {
      return res.status(404).json({ status: 'error', message: 'Fine not found.' });
    }
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

router.patch('/:fine_id', async (req, res, next) => {
  try {
    const { fine_id } = req.params;
    const payload = await settleFine(fine_id);
    if (!payload) {
      return res.status(404).json({ status: 'error', message: 'Fine not found.' });
    }
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

export default router;
