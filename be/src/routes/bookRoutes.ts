import { Router } from 'express';
import { searchBooks, viewBookDetails, borrowBook, returnBook, addBook, getActiveLoansByMember, getAllActiveLoans, getUnpaidFines, settleFine, runDiagnostics, repairDatabases, deleteBookRecord, updateBookDetails, getArchivedBooks, restoreBookFromVault, getAllAuthors, updateAuthorRecord, deleteAuthorRecord, getArchivedAuthors, restoreAuthor, getAuditTrails, addAuthor, getAllCategories } from '../controllers/bookController';
import { verifyToken } from '../middleware/auth';
import { validateData, createBookSchema } from '../middleware/validators';

const router = Router();

router.get('/search', searchBooks);
router.post('/add', validateData(createBookSchema), addBook);
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
router.post('/add', verifyToken, validateData(createBookSchema), addBook);
router.post('/admin/authors/add', verifyToken, addAuthor);
router.get('/categories', getAllCategories);

// NEW: Audit Log Route
router.get('/admin/audit-logs', verifyToken, getAuditTrails);

router.get('/:bookId', viewBookDetails);


export default router;