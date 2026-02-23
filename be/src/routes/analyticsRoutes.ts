import { Router } from 'express';
import { getLibraryStats } from '../controllers/analyticsController';

const router = Router();

// GET /api/analytics/dashboard
router.get('/dashboard', getLibraryStats);

export default router;

