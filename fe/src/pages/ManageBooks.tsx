import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

export default function ManageBooks() {
  const navigate = useNavigate();
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Edit Modal State
  const [editingBook, setEditingBook] = useState<any>(null);
  const [editForm, setEditForm] = useState({ title: "", isbn: "", synopsis: "", totalCopies: 1 });

  const fetchBooks = async () => {
    try {
      // Reusing our powerful search endpoint to get all books
      const res = await api.get("/books/search?keyword=&type=all&status=all");
      setBooks(res.data.data);
    } catch (err) {
      setError("Failed to fetch catalog.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBooks(); }, []);

  const openEditModal = (book: any) => {
    setEditingBook(book);
    setEditForm({
      title: book.title,
      // FIX: These will now successfully pull the live data!
      isbn: book.isbn, 
      synopsis: book.synopsis || "",
      totalCopies: book.total_copies 
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    try {
      await api.put(`/books/admin/manage/${editingBook.book_id}`, {
        ...editForm,
        authorId: 1, // Hardcoded for this demo - you'd normally have an author dropdown here
        categoryId: 1 // Hardcoded for this demo - you'd normally have a category dropdown here
      }, { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }});
      
      setSuccess(`"${editForm.title}" updated successfully.`);
      setEditingBook(null);
      fetchBooks();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update book.");
    }
  };

  const handleDelete = async (bookId: number, title: string) => {
    if (!window.confirm(`Are you sure you want to archive "${title}"? It will be permanently deleted in 30 days.`)) return;
    setError(""); setSuccess("");
    try {
      await api.delete(`/books/admin/manage/${bookId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setSuccess(`"${title}" has been moved to the archive vault.`);
      fetchBooks();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to archive book.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken"); localStorage.removeItem("role"); navigate("/librarian-login");
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif', backgroundColor: '#f8fafc' }}>
      
      {/* Sidebar */}
      <div style={{ width: '250px', backgroundColor: '#0f172a', color: 'white', padding: '20px' }}>
        <h3>Staff Panel</h3>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '30px' }}>
          <Link to="/admin/dashboard" style={{ color: 'white', textDecoration: 'none' }}>📊 Stats Overview</Link>
          <Link to="/add-book" style={{ color: 'white', textDecoration: 'none' }}>📚 Add New Book</Link>
          <Link to="/admin/books" style={{ color: '#38bdf8', textDecoration: 'none' }}>📖 Manage Books</Link>
          <Link to="/admin/borrow" style={{ color: 'white', textDecoration: 'none' }}>🤝 Issue a Loan</Link>
          <button onClick={handleLogout} style={{ marginTop: '50px', backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
        </nav>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '40px' }}>
        <h2>Book Catalog Management</h2>
        <p style={{ color: '#64748b', marginTop: '-10px', marginBottom: '30px' }}>Edit inventory details or move books to the 30-day archive vault.</p>

        {error && <div style={{ color: '#b91c1c', marginBottom: '15px', padding: '15px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '4px', fontWeight: 'bold' }}>{error}</div>}
        {success && <div style={{ color: '#15803d', marginBottom: '15px', padding: '15px', backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '4px', fontWeight: 'bold' }}>{success}</div>}

        <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                <th style={{ padding: '15px 20px' }}>System ID</th>
                <th style={{ padding: '15px 20px' }}>Title & Author</th>
                <th style={{ padding: '15px 20px' }}>ISBN</th>
                <th style={{ padding: '15px 20px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={4} style={{ padding: '20px', textAlign: 'center' }}>Loading catalog...</td></tr> : 
                books.map(book => (
                  <tr key={book.book_id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '15px 20px', color: '#64748b' }}>#{book.book_id}</td>
                    <td style={{ padding: '15px 20px' }}><strong>{book.title}</strong><br/><span style={{ fontSize: '12px', color: '#64748b' }}>by {book.author}</span></td>
                    <td style={{ padding: '15px 20px', fontFamily: 'monospace' }}>{book.isbn}</td>
                    <td style={{ padding: '15px 20px', textAlign: 'right' }}>
                      <button onClick={() => openEditModal(book)} style={{ marginRight: '10px', padding: '6px 12px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => handleDelete(book.book_id, book.title)} style={{ padding: '6px 12px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Archive</button>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* EDIT MODAL */}
        {editingBook && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '400px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <h3 style={{ marginTop: 0 }}>Edit Book: {editingBook.book_id}</h3>
              <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div><label>Title:</label><input type="text" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} required /></div>
                <div><label>ISBN:</label><input type="text" value={editForm.isbn} onChange={e => setEditForm({...editForm, isbn: e.target.value})} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} required /></div>
                <div><label>Synopsis:</label><textarea value={editForm.synopsis} onChange={e => setEditForm({...editForm, synopsis: e.target.value})} style={{ width: '100%', padding: '8px', boxSizing: 'border-box', height: '80px' }} required /></div>
                <div><label>Total Copies:</label><input type="number" min="1" value={editForm.totalCopies} onChange={e => setEditForm({...editForm, totalCopies: Number(e.target.value)})} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} required /></div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button type="submit" style={{ flex: 1, padding: '10px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save Changes</button>
                  <button type="button" onClick={() => setEditingBook(null)} style={{ flex: 1, padding: '10px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}