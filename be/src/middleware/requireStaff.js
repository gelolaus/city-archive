/**
 * Require an active staff (librarian) session.
 * Use on routes that must only be accessible after staff login.
 * Returns 401 if not authenticated as staff.
 */
export default function requireStaff(req, res, next) {
  if (req.session && req.session.staffId != null) {
    return next();
  }
  return res.status(401).json({ status: 'error', message: 'Not authenticated as staff.' });
}
