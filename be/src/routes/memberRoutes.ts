import { Router } from 'express';
import { registerMember, loginMember, loginLibrarian } from '../controllers/memberController';
import { validateData, registerSchema } from '../middleware/validators';
import { searchMembers } from '../controllers/memberController';

const router = Router();

// --- MEMBER ROUTES ---

// POST /api/members/register
router.post('/register', validateData(registerSchema), registerMember);

// POST /api/members/login
router.post('/login', loginMember);


// --- STAFF / LIBRARIAN ROUTES ---

// POST /api/members/auth/login/librarian
router.post('/login/librarian', loginLibrarian);

// GET /api/members/search
router.get('/search', searchMembers);

export default router;