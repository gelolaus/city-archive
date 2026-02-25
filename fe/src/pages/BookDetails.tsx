import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function BookDetails() {
  const { id } = useParams(); // Grabs the ID from the URL (/book/1)
  const navigate = useNavigate();
  
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const response = await api.get(`/books/${id}`);
        setBook(response.data.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Could not load book details.");
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [id]);

  if (loading) return <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'sans-serif' }}>Loading Book Data...</div>;
  if (error) return <div style={{ textAlign: 'center', padding: '50px', color: 'red', fontFamily: 'sans-serif' }}>{error}</div>;
  if (!book) return null;

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      
      {/* Back Navigation */}
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '16px', marginBottom: '20px', padding: 0 }}>
        ← Back to Catalog
      </button>

      <div style={{ display: 'flex', gap: '40px', backgroundColor: '#fff', padding: '30px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        
        {/* Left Column: Cover Image */}
        <div style={{ flex: '0 0 300px' }}>
          <img 
            src={book.cover_image} 
            alt={book.title} 
            style={{ width: '100%', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} 
          />
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            {book.available ? (
               <div style={{ padding: '10px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '6px', fontWeight: 'bold' }}>
                 🟢 Available ({book.inventory?.available_copies} of {book.inventory?.total_copies} copies)
               </div>
            ) : (
               <div style={{ padding: '10px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '6px', fontWeight: 'bold' }}>
                 🔴 Currently Checked Out
               </div>
            )}
          </div>
        </div>

        {/* Right Column: Book Metadata */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'inline-block', backgroundColor: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', marginBottom: '10px' }}>
            {book.category}
          </div>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '36px', color: '#0f172a' }}>{book.title}</h1>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#475569', fontWeight: 'normal' }}>by {book.author}</h2>
          
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px', marginTop: '20px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>Synopsis</h3>
            <p style={{ lineHeight: '1.6', color: '#334155' }}>{book.synopsis}</p>
          </div>

          <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#64748b' }}><strong>ISBN:</strong> {book.isbn}</p>
            <p style={{ margin: '0', fontSize: '14px', color: '#64748b' }}><strong>System ID:</strong> {book.book_id}</p>
          </div>
        </div>

      </div>
    </div>
  );
}