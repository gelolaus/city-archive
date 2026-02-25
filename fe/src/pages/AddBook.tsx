import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function AddBook() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    isbn: "",
    authorId: 1, // Default to Jose Rizal (ID: 1)
    categoryId: 2, // Default to Fiction (ID: 2)
    synopsis: "",
    coverImage: "",
    totalCopies: 1
  });

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData({ 
        ...formData, 
        // Convert number fields to actual Integers for Zod
        [name]: (name === 'authorId' || name === 'categoryId' || name === 'totalCopies') ? Number(value) : value 
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.post("/books/add", formData);
      setSuccess("Book successfully added to the catalog!");
      // Send them to see their new book!
      setTimeout(() => navigate(`/book/${response.data.bookId}`), 2000);
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const zodErrors = err.response.data.errors;
        const firstErrorKey = Object.keys(zodErrors)[0];
        setError(`Validation Error: ${zodErrors[firstErrorKey][0]}`);
      } else {
        setError(err.response?.data?.message || "Failed to add book. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px 0', fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ marginTop: 0, fontSize: '26px', fontWeight: 600 }}>Quick Add Book</h2>
        <p style={{ color: '#64748b', marginTop: '6px', marginBottom: 0, fontSize: '14px' }}>
          Lightweight form for manually inserting a single title.
        </p>
      </div>
      <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '30px' }}>
        <h2 style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '15px', marginTop: 0 }}>Add New Book to Catalog</h2>
        
        {error && <div style={{ color: '#b91c1c', marginBottom: '15px', padding: '10px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '4px' }}>{error}</div>}
        {success && <div style={{ color: '#15803d', marginBottom: '15px', padding: '10px', backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '4px' }}>{success}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {/* ROW 1: Title and ISBN */}
        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={{ flex: 2 }}>
            <label style={{ fontWeight: 'bold', fontSize: '14px' }}>Book Title *</label>
            <input type="text" name="title" required value={formData.title} onChange={handleChange} style={{ width: '100%', padding: '10px', marginTop: '5px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: 'bold', fontSize: '14px' }}>ISBN *</label>
            <input type="text" name="isbn" required value={formData.isbn} onChange={handleChange} placeholder="e.g. 978-3-16-148410-0" style={{ width: '100%', padding: '10px', marginTop: '5px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }} />
          </div>
        </div>

        {/* ROW 2: Relational Data (MySQL) */}
        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: 'bold', fontSize: '14px' }}>Author *</label>
            <select name="authorId" value={formData.authorId} onChange={handleChange} style={{ width: '100%', padding: '10px', marginTop: '5px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }}>
              <option value={1}>Jose Rizal</option>
              <option value={2}>J.K. Rowling</option>
              <option value={3}>George Orwell</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: 'bold', fontSize: '14px' }}>Category *</label>
            <select name="categoryId" value={formData.categoryId} onChange={handleChange} style={{ width: '100%', padding: '10px', marginTop: '5px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }}>
              <option value={1}>Fantasy</option>
              <option value={2}>Fiction</option>
              <option value={3}>Non-Fiction</option>
              <option value={4}>Science</option>
              <option value={5}>History</option>
            </select>
          </div>
        </div>

        {/* ROW 3: Rich Data (MongoDB) */}
        <div>
            <label style={{ fontWeight: 'bold', fontSize: '14px' }}>Cover Image URL (Optional)</label>
            <input type="url" name="coverImage" value={formData.coverImage} onChange={handleChange} placeholder="https://example.com/cover.jpg" style={{ width: '100%', padding: '10px', marginTop: '5px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }} />
        </div>

        <div>
            <label style={{ fontWeight: 'bold', fontSize: '14px' }}>Synopsis (Optional)</label>
            <textarea name="synopsis" value={formData.synopsis} onChange={handleChange} rows={4} style={{ width: '100%', padding: '10px', marginTop: '5px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }} />
        </div>

        <div style={{ width: '30%' }}>
            <label style={{ fontWeight: 'bold', fontSize: '14px' }}>Total Copies *</label>
            <input type="number" name="totalCopies" min="1" required value={formData.totalCopies} onChange={handleChange} style={{ width: '100%', padding: '10px', marginTop: '5px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }} />
        </div>

        <button type="submit" disabled={loading} style={{ padding: '12px', backgroundColor: '#0f172a', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold', marginTop: '10px' }}>
          {loading ? "Adding to Databases..." : "Add Book"}
        </button>
      </form>
      </div>
    </div>
  );
}