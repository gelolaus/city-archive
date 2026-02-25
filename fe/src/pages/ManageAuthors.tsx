import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

export default function ManageAuthors() {
  const navigate = useNavigate();
  const [authors, setAuthors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [editingAuthor, setEditingAuthor] = useState<any>(null);
  const [editForm, setEditForm] = useState({ first_name: "", last_name: "" });

  const fetchAuthors = async () => {
    try {
      const res = await api.get("/books/admin/authors", {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setAuthors(res.data.data);
    } catch (err) {
      setError("Failed to fetch authors list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAuthors(); }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/books/admin/authors/${editingAuthor.author_id}`, editForm, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setSuccess("Author updated!");
      setEditingAuthor(null);
      fetchAuthors();
    } catch (err: any) {
      setError(err.response?.data?.message || "Update failed.");
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Archive ${name}?`)) return;
    try {
      await api.delete(`/books/admin/authors/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setSuccess("Author archived for 30 days.");
      fetchAuthors();
    } catch (err: any) {
      setError(err.response?.data?.message || "Archive failed.");
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Sidebar - Same as other Admin pages */}
      <div style={{ width: '250px', backgroundColor: '#0f172a', color: 'white', padding: '20px' }}>
        <h3>Staff Panel</h3>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '30px' }}>
          <Link to="/admin/dashboard" style={{ color: 'white', textDecoration: 'none' }}>📊 Stats Overview</Link>
          <Link to="/admin/books" style={{ color: 'white', textDecoration: 'none' }}>📖 Manage Books</Link>
          <Link to="/admin/authors" style={{ color: '#38bdf8', textDecoration: 'none' }}>✍️ Manage Authors</Link>
          <button onClick={() => navigate("/librarian-login")} style={{ marginTop: '50px', backgroundColor: '#ef4444', border: 'none', padding: '10px', color: 'white', cursor: 'pointer' }}>Logout</button>
        </nav>
      </div>

      <div style={{ flex: 1, padding: '40px' }}>
        <h2>Author Directory</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {success && <p style={{ color: 'green' }}>{success}</p>}

        <table style={{ width: '100%', backgroundColor: 'white', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '15px' }}>Author Name</th>
              <th style={{ padding: '15px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {authors.map(a => (
              <tr key={a.author_id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '15px' }}>{a.first_name} {a.last_name}</td>
                <td style={{ padding: '15px', textAlign: 'right' }}>
                  <button onClick={() => { setEditingAuthor(a); setEditForm({ first_name: a.first_name, last_name: a.last_name }); }} style={{ marginRight: '10px' }}>Edit</button>
                  <button onClick={() => handleDelete(a.author_id, `${a.first_name} ${a.last_name}`)} style={{ color: 'red' }}>Archive</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {editingAuthor && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px' }}>
              <h3>Edit Author</h3>
              <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input value={editForm.first_name} onChange={e => setEditForm({ ...editForm, first_name: e.target.value })} placeholder="First Name" required />
                <input value={editForm.last_name} onChange={e => setEditForm({ ...editForm, last_name: e.target.value })} placeholder="Last Name" required />
                <button type="submit" style={{ backgroundColor: '#0f172a', color: 'white', padding: '10px' }}>Save</button>
                <button type="button" onClick={() => setEditingAuthor(null)}>Cancel</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}