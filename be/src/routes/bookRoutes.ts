import { Router } from 'express';
import { searchBooks, viewBookDetails, borrowBook, returnBook } from '../controllers/bookController';

const router = Router();

router.get('/search', searchBooks);
router.post('/view/:bookId', viewBookDetails);
router.post('/borrow', borrowBook);
router.post('/return/:loanId', returnBook);

export default router;

