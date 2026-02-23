import { Router } from 'express';
import { searchBooks, viewBookDetails, borrowBook, returnBook } from '../controllers/bookController';
import { verifyToken } from '../middleware/auth';

const router = Router();

router.get('/search', searchBooks);
router.post('/view/:bookId', viewBookDetails);
router.post('/borrow', verifyToken, borrowBook);
router.post('/return/:loanId', verifyToken, returnBook);

export default router;

