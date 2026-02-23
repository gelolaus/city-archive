import { Router } from 'express';
import { addBook } from '../controllers/librarianController';

const router = Router();

// POST /api/librarian/add-book
router.post('/add-book', addBook);

export default router;

