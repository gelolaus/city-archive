import { Router } from 'express';
import { registerMember, loginMember, loginLibrarian, searchMembers, getDashboardData, getAdminStats } from '../controllers/memberController';
import { validateData, registerSchema } from '../middleware/validators';

const router = Router();

// --- MEMBER ROUTES ---

// POST /api/members/register
router.post('/register', validateData(registerSchema), registerMember);

// POST /api/members/login
router.post('/login', loginMember);


router.get('/dashboard', getDashboardData);


// --- STAFF / LIBRARIAN ROUTES ---

// POST /api/members/auth/login/librarian
router.post('/login/librarian', loginLibrarian);

// GET /api/members/admin/stats
router.get('/admin/stats', getAdminStats);

// GET /api/members/search
router.get('/search', searchMembers);

export default router;