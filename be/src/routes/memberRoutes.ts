import { Router } from 'express';
import { registerMember, loginMember } from '../controllers/memberController';
import { validateData, registerSchema } from '../middleware/validators';

const router = Router();

// POST /api/members/register
router.post('/register', validateData(registerSchema), registerMember);

// POST /api/members/login
router.post('/login', loginMember);

export default router;

