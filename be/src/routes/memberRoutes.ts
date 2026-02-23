import { Router } from 'express';
import { registerMember, loginMember } from '../controllers/memberController';

const router = Router();

// POST /api/members/register
router.post('/register', registerMember);

// POST /api/members/login
router.post('/login', loginMember);

export default router;

