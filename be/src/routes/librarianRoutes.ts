import { Router } from 'express';
import { addBook } from '../controllers/librarianController';
import { verifyToken, isLibrarian } from '../middleware/auth';

const router = Router();

// POST /api/librarian/add-book
router.post('/add-book', verifyToken, isLibrarian, addBook);

export default router;

