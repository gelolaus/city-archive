import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Catalog() {
  const navigate = useNavigate();
  // State to hold our library data
  const [books, setBooks] = useState<any[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // The function that actually calls our Express backend
  const fetchBooks = async (searchKeyword = "") => {
    setLoading(true);
    setError("");
    try {
      // Calls: GET http://localhost:5000/api/books/search?keyword=...
      const response = await api.get("/books/search", {
        params: { keyword: searchKeyword }
      });
      
      // We dive into response.data.data because of how we structured our Express JSON response
      setBooks(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch books.");
    } finally {
      setLoading(false);
    }
  };

  // useEffect with an empty array [] means "Run this EXACTLY ONCE when the page loads"
  useEffect(() => {
    fetchBooks();
  }, []);

  // Handle the search form submission
  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    fetchBooks(keyword);
  };

  // Destroy the VIP passes and kick the user back to the login screen
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("session_id");
    navigate("/login");
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ccc', paddingBottom: '10px', marginBottom: '20px' }}>
        <h2>Library Catalog</h2>
        <button 
          onClick={handleLogout}
          style={{ padding: '8px 16px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Logout
        </button>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Search by title, author, or ISBN..."
          style={{ flex: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <button 
          type="submit" 
          style={{ padding: '10px 20px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}

      {/* Book List Rendering */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {books.length === 0 && !loading ? (
          <p style={{ textAlign: 'center', color: '#666' }}>No books found.</p>
        ) : (
          books.map((book) => (
            <div key={book.book_id} style={{ border: '1px solid #e2e8f0', padding: '15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 5px 0' }}>{book.title}</h3>
                <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>ISBN: {book.isbn}</p>
              </div>
              <div>
                <button style={{ padding: '8px 16px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  Borrow Book
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}