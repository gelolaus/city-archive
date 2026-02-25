import { useState, useEffect, type FormEvent } from "react";
import api from "../api/axios";

export default function BorrowBook() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // --- MEMBER SEARCH STATE ---
  const [memberQuery, setMemberQuery] = useState("");
  const [memberResults, setMemberResults] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  // --- BOOK SEARCH STATE ---
  const [bookQuery, setBookQuery] = useState("");
  const [bookResults, setBookResults] = useState<any[]>([]);
  const [selectedBook, setSelectedBook] = useState<any>(null);

  // Safely extract the Librarian ID from the JWT token
  const getLibrarianId = () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return 1;
    try { return JSON.parse(atob(token.split('.')[1])).id; } catch { return 1; }
  };

  // --- REAL-TIME SEARCH HOOKS ---
  useEffect(() => {
    if (memberQuery.length > 1 && !selectedMember) {
      api.get(`/members/search?keyword=${memberQuery}`)
         .then(res => setMemberResults(res.data.data))
         .catch(err => console.error(err));
    } else {
      setMemberResults([]);
    }
  }, [memberQuery, selectedMember]);

  useEffect(() => {
    // Only search for 'available' books using our awesome MySQL procedure
    if (bookQuery.length > 1 && !selectedBook) {
      api.get(`/books/search?keyword=${bookQuery}&status=available`)
         .then(res => setBookResults(res.data.data))
         .catch(err => console.error(err));
    } else {
      setBookResults([]);
    }
  }, [bookQuery, selectedBook]);

  // --- TRANSACTION EXECUTION ---
  const handleBorrow = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !selectedBook) return setError("Please select both a valid member and an available book.");
    
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Execute the POST request, passing the admin token for security
      await api.post("/books/borrow", {
        memberId: selectedMember.member_id,
        bookId: selectedBook.book_id,
        librarianId: getLibrarianId()
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });

      setSuccess(`Success! "${selectedBook.title}" has been issued to ${selectedMember.full_name}.`);
      
      // Reset the form for the next customer
      setTimeout(() => {
        setSelectedMember(null); setMemberQuery("");
        setSelectedBook(null); setBookQuery("");
        setSuccess("");
      }, 3000);

    } catch (err: any) {
      setError(err.response?.data?.database_error || err.response?.data?.message || "Failed to process loan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: 600, margin: 0 }}>Issue Book Loan</h2>
        <p style={{ color: '#64748b', marginTop: '6px', marginBottom: 0, fontSize: '14px' }}>
          Process a new borrowing transaction securely.
        </p>
      </div>

      {error && <div style={{ color: '#b91c1c', marginBottom: '15px', padding: '10px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '4px' }}>{error}</div>}
      {success && <div style={{ color: '#15803d', marginBottom: '15px', padding: '10px', backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '4px' }}>{success}</div>}

      <form onSubmit={handleBorrow} style={{ display: 'flex', flexDirection: 'column', gap: '25px', backgroundColor: 'white', padding: '30px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          
          {/* 1. MEMBER DROPDOWN */}
          <div style={{ position: 'relative' }}>
            <label style={{ fontWeight: 'bold', fontSize: '14px', display: 'block', marginBottom: '5px' }}>1. Find Member</label>
            {selectedMember ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                <span><strong>{selectedMember.full_name}</strong> (ID: {selectedMember.member_id})</span>
                <button type="button" onClick={() => { setSelectedMember(null); setMemberQuery(""); }} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: 'bold' }}>✕ Change</button>
              </div>
            ) : (
              <>
                <input 
                  type="text" 
                  placeholder="Type member name, email, or username..." 
                  value={memberQuery} 
                  onChange={(e) => setMemberQuery(e.target.value)} 
                  style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }} 
                />
                {memberResults.length > 0 && (
                  <ul style={{ position: 'absolute', width: '100%', backgroundColor: 'white', border: '1px solid #ccc', borderTop: 'none', listStyle: 'none', padding: 0, margin: 0, maxHeight: '200px', overflowY: 'auto', zIndex: 10 }}>
                    {memberResults.map(m => (
                      <li key={m.member_id} onClick={() => { setSelectedMember(m); setMemberResults([]); }} style={{ padding: '10px', borderBottom: '1px solid #eee', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}>
                        <strong>{m.full_name}</strong> <span style={{ color: '#64748b', fontSize: '12px' }}>- ID: {m.member_id} ({m.email})</span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>

          {/* 2. BOOK DROPDOWN */}
          <div style={{ position: 'relative' }}>
            <label style={{ fontWeight: 'bold', fontSize: '14px', display: 'block', marginBottom: '5px' }}>2. Find Book (Available Only)</label>
            {selectedBook ? (
              <div style={{ padding: '15px', backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span><strong>{selectedBook.title}</strong> by {selectedBook.author}</span>
                  <button type="button" onClick={() => { setSelectedBook(null); setBookQuery(""); }} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: 'bold' }}>✕ Change</button>
                </div>
                {/* Displaying the MongoDB Rich Data! */}
                <div style={{ fontSize: '12px', color: '#475569', borderTop: '1px dashed #bbf7d0', paddingTop: '10px' }}>
                  <p style={{ margin: '0 0 5px 0' }}><strong>Synopsis:</strong> {selectedBook.synopsis.substring(0, 100)}...</p>
                  <p style={{ margin: 0 }}><strong>System ID:</strong> {selectedBook.book_id}</p>
                </div>
              </div>
            ) : (
              <>
                <input 
                  type="text" 
                  placeholder="Type book title, author, or ISBN..." 
                  value={bookQuery} 
                  onChange={(e) => setBookQuery(e.target.value)} 
                  style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }} 
                />
                {bookResults.length > 0 && (
                  <ul style={{ position: 'absolute', width: '100%', backgroundColor: 'white', border: '1px solid #ccc', borderTop: 'none', listStyle: 'none', padding: 0, margin: 0, maxHeight: '200px', overflowY: 'auto', zIndex: 10 }}>
                    {bookResults.map(b => (
                      <li key={b.book_id} onClick={() => { setSelectedBook(b); setBookResults([]); }} style={{ padding: '10px', borderBottom: '1px solid #eee', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}>
                        <span><strong>{b.title}</strong> by {b.author}</span>
                        <span style={{ color: '#64748b', fontSize: '12px' }}>ID: {b.book_id}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>

          <button type="submit" disabled={loading || !selectedMember || !selectedBook} style={{ padding: '15px', backgroundColor: (!selectedMember || !selectedBook) ? '#94a3b8' : '#0f172a', color: 'white', border: 'none', cursor: (!selectedMember || !selectedBook) ? 'not-allowed' : 'pointer', borderRadius: '4px', fontWeight: 'bold', fontSize: '16px', marginTop: '10px' }}>
            {loading ? "Processing Transaction..." : "Issue Loan to Member"}
          </button>
      </form>
    </div>
  );
}