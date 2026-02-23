import express from 'express';
import { mysqlPool } from '../config/db.js';
import requireStaff from '../middleware/requireStaff.js';

const router = express.Router();

router.post('/login/member', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'Email and password are required.' });
    }
    const [rows] = await mysqlPool.query(
      'SELECT * FROM members WHERE email = ?',
      [email]
    );
    if (rows.length === 0) {
      return res.status(401).json({ status: 'error', message: 'Invalid email or password.' });
    }
    const member = rows[0];
    const match = member.password_hash === password;
    if (!match) {
      return res.status(401).json({ status: 'error', message: 'Invalid email or password.' });
    }
    const { password: _, ...safe } = member;
    res.json({ status: 'ok', member: safe });
  } catch (err) {
    next(err);
  }
});

router.post('/login/staff', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'Email and password are required.' });
    }
    const [rows] = await mysqlPool.query(
      'SELECT * FROM librarians WHERE email = ?',
      [email]
    );
    if (rows.length === 0) {
      return res.status(401).json({ status: 'error', message: 'Invalid email or password.' });
    }
    const staff = rows[0];
    const match = staff.password_hash === password;
    if (!match) {
      return res.status(401).json({ status: 'error', message: 'Invalid email or password.' });
    }
    const { password: _, ...safe } = staff;
    req.session.staffId = staff.librarian_id;
    req.session.save((err) => {
      if (err) return next(err);
      res.json({ status: 'ok', staff: safe });
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/staff/check - 200 if logged in as staff, 401 otherwise (for admin UI gate)
router.get('/staff/check', requireStaff, (req, res) => {
  res.json({ status: 'ok' });
});

// POST /api/auth/logout/staff - Destroy staff session
router.post('/logout/staff', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ status: 'error', message: 'Logout failed.' });
    res.json({ status: 'ok' });
  });
});

export default router;
