import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import api from "../api/axios";

export default function Catalog() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // States for our Search & Filters
  const [keyword, setKeyword] = useState(searchParams.get("keyword") || "");
  const [searchType, setSearchType] = useState("all"); // 'all', 'title', 'author'
  const [availabilityFilter, setAvailabilityFilter] = useState("all"); // 'all', 'available', 'borrowed'
  
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Check if user is logged in to toggle the top-right button
  const isLoggedIn = !!localStorage.getItem("token");

  // Fetch books from the backend (We will upgrade the backend to handle these filters next!)
  const fetchBooks = async () => {
    setLoading(true);
    setError("");
    try {
      // Sending all our filter states to the backend
      const response = await api.get("/books/search", {
        params: { 
          keyword: keyword,
          type: searchType,
          status: availabilityFilter
        }
      });
      setBooks(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch the catalog.");
    } finally {
      setLoading(false);
    }
  };

  // Run fetch automatically if a keyword was passed from the Dashboard Quick Search
  useEffect(() => {
    fetchBooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    // Update the URL so it can be shared/bookmarked
    setSearchParams(keyword ? { keyword } : {});
    fetchBooks();
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ccc', paddingBottom: '10px', marginBottom: '20px' }}>
        <h2>City Archive | Public Catalog</h2>
        {isLoggedIn ? (
          <Link to="/dashboard" style={{ padding: '8px 16px', backgroundColor: '#0f172a', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>Go to Dashboard</Link>
        ) : (
          <Link to="/login" style={{ padding: '8px 16px', backgroundColor: '#2563eb', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>Member Login</Link>
        )}
      </div>

      {/* Feature 1 & 2: Search Bar and Filters */}
      <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search books, authors, or ISBNs..."
              style={{ flex: 1, padding: '12px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '16px' }}
            />
            <button type="submit" style={{ padding: '12px 24px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              {loading ? "Searching..." : "Search Catalog"}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '20px', fontSize: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontWeight: 'bold' }}>Search In:</label>
              <select value={searchType} onChange={(e) => setSearchType(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}>
                <option value="all">Anywhere</option>
                <option value="title">Title Only</option>
                <option value="author">Author Only</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontWeight: 'bold' }}>Availability:</label>
              <select value={availabilityFilter} onChange={(e) => setAvailabilityFilter(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}>
                <option value="all">Show All Books</option>
                <option value="available">Available Now</option>
                <option value="borrowed">Currently Borrowed</option>
              </select>
            </div>
          </div>

        </form>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}

      {/* Result Grid */}
      <div>
        {books.length === 0 && !loading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#64748b', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>
            <h3>No books found.</h3>
            <p>Try adjusting your search filters.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {books.map((book) => (
              // Feature 3 & 4: Clickable card leading to Book Page (No direct borrow button)
              <div 
                key={book.book_id} 
                onClick={() => navigate(`/book/${book.book_id}`)}
                style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', cursor: 'pointer', transition: 'box-shadow 0.2s', backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <h3 style={{ margin: '0', fontSize: '18px', color: '#0f172a' }}>{book.title}</h3>
                  
                  {/* Visual Status Indicator */}
                  {book.available ? (
                    <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>Available</span>
                  ) : (
                    <span style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>Borrowed</span>
                  )}
                </div>
                
                <div style={{ color: '#475569', fontSize: '14px', marginBottom: '15px' }}>
                  <p style={{ margin: '0 0 5px 0' }}><strong>Author:</strong> {book.author}</p>
                  <p style={{ margin: '0 0 5px 0' }}><strong>Category:</strong> {book.category}</p>
                </div>

                <div style={{ textAlign: 'right', fontSize: '14px', color: '#2563eb', fontWeight: 'bold' }}>
                  View Details →
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}