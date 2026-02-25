import { Router } from 'express';
// 1. Added addBook to the imports
import { searchBooks, viewBookDetails, borrowBook, returnBook, addBook, getActiveLoansByMember, getAllActiveLoans, getUnpaidFines, settleFine, runDiagnostics, repairDatabases, deleteBookRecord, updateBookDetails, getArchivedBooks, restoreBookFromVault, getAllAuthors, updateAuthorRecord, deleteAuthorRecord, getArchivedAuthors, restoreAuthor } from '../controllers/bookController';
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
router.get('/loans/active/all', verifyToken, getAllActiveLoans);
router.get('/fines/unpaid', verifyToken, getUnpaidFines);
router.post('/fines/settle/:fineId', verifyToken, settleFine);
router.get('/system/diagnostics', verifyToken, runDiagnostics);
router.post('/system/repair', verifyToken, repairDatabases);
router.put('/admin/manage/:bookId', verifyToken, updateBookDetails);
router.delete('/admin/manage/:bookId', verifyToken, deleteBookRecord);
router.get('/admin/archive/books', verifyToken, getArchivedBooks);
router.post('/admin/restore/:archiveId', verifyToken, restoreBookFromVault);
router.get('/admin/authors', verifyToken, getAllAuthors);
router.put('/admin/authors/:authorId', verifyToken, updateAuthorRecord);
router.delete('/admin/authors/:authorId', verifyToken, deleteAuthorRecord);
router.get('/admin/archive/authors', verifyToken, getArchivedAuthors);
router.post('/admin/restore/authors/:archiveId', verifyToken, restoreAuthor);

export default router;