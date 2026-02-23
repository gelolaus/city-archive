import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import mongoose from 'mongoose';
import { connectMongo, mysqlPool } from './config/db.js';
import mysqlErrorHandler from './middleware/mysqlErrorHandler.js';
import requireStaff from './middleware/requireStaff.js';
import authRoutes from './routes/authRoutes.js';
import logRoutes from './routes/logRoutes.js';
import catalogRoutes from './routes/catalogRoutes.js';
import circulationRoutes from './routes/circulationRoutes.js';
import membersRoutes from './routes/membersRoutes.js';
import finesRoutes from './routes/finesRoutes.js';
import bookIngestRoutes from './routes/bookIngestRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import authorsRoutes from './routes/authorsRoutes.js';
import loansRoutes from './routes/loansRoutes.js';

const app = express();

// Trust first proxy (e.g. Vite dev server) so session cookies work when proxying
app.set('trust proxy', 1);

connectMongo();

const corsOrigin = process.env.FRONTEND_URL || true;
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'city-archive-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

app.get('/', (req, res) => {
  res.send('City Library Archives API Running');
});

app.get('/api/health', async (req, res) => {
  try {
    await mysqlPool.query('SELECT 1');
    const mongodb = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({
      status: 'healthy',
      mysql: 'connected',
      mongodb,
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/log', logRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api', circulationRoutes);
app.use('/api/members', membersRoutes);
app.use('/api/fines', requireStaff, finesRoutes);
app.use('/api/books', requireStaff, bookIngestRoutes);
app.use('/api/dashboard', requireStaff, dashboardRoutes);
app.use('/api/authors', requireStaff, authorsRoutes);
app.use('/api/loans', requireStaff, loansRoutes);

app.use(mysqlErrorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
