import { Router } from 'express';
import { registerMember, loginMember, loginLibrarian, searchMembers, getDashboardData, getAdminStats, getAllMembers, updateMemberDetails, toggleMemberStatus } from '../controllers/memberController';
import { validateData, registerSchema } from '../middleware/validators';
import { verifyToken } from '../middleware/auth';

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

router.get('/admin/list', verifyToken, getAllMembers);
router.put('/admin/update/:memberId', verifyToken, updateMemberDetails);
router.patch('/admin/toggle-status/:memberId', verifyToken, toggleMemberStatus);
router.put('/admin/update/:memberId', verifyToken, updateMemberDetails);

export default router;