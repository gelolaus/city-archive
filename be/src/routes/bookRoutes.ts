import { Router } from 'express';
// 1. Added addBook to the imports
import { searchBooks, viewBookDetails, borrowBook, returnBook, addBook, getActiveLoansByMember } from '../controllers/bookController';
import { verifyToken } from '../middleware/auth';
// 2. Imported the Bouncer (Zod validator) and the exact schema for creating books
import { validateData, createBookSchema } from '../middleware/validators';

const router = Router();

// Public Routes
router.get('/search', searchBooks);

// The New Add Book Route! (Protected by Zod, but skipping JWT auth for your testing phase)
router.post('/add', validateData(createBookSchema), addBook);

// FIXED: Changed from POST '/view/:bookId' to GET '/:bookId' to perfectly match the React frontend
router.get('/:bookId', viewBookDetails);

// Protected Member Operations
router.post('/borrow', verifyToken, borrowBook);
router.post('/return/:loanId', verifyToken, returnBook);
router.get('/loans/member/:memberId', getActiveLoansByMember);

export default router;