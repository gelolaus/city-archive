import { Router } from 'express';
import { registerMember } from '../controllers/memberController';

const router = Router();

// POST /api/members/register
router.post('/register', registerMember);

export default router;

