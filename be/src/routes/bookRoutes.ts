import { Router } from 'express';
import { searchBooks, viewBookDetails, borrowBook } from '../controllers/bookController';

const router = Router();

router.get('/search', searchBooks);
router.post('/view/:bookId', viewBookDetails);
router.post('/borrow', borrowBook);

export default router;

