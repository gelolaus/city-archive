import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

export default function LibrarianLogin() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      // Path must match the router prefix (e.g., /api/members/login/librarian)
      const response = await api.post("/members/login/librarian", { 
          identifier: identifier, 
          password: password 
      });

      localStorage.setItem('adminToken', response.data.token);
      localStorage.setItem('role', 'librarian');
      localStorage.setItem('session_id', response.data.session_id);

      navigate("/admin/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid credentials. Check staff status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '50px', maxWidth: '300px', margin: '50px auto', fontFamily: 'sans-serif', border: '2px solid #0f172a', borderRadius: '8px' }}>
      <h2 style={{ textAlign: 'center' }}>Librarian Login</h2>
      
      {error && (
        <div style={{ color: 'red', marginBottom: '15px', padding: '10px', backgroundColor: '#ffe6e6', border: '1px solid red', fontSize: '13px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={{ fontWeight: 'bold' }}>Staff Username / Email:</label>
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ fontWeight: 'bold' }}>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box' }}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ padding: '10px', backgroundColor: '#0f172a', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
        >
          {loading ? "Authenticating..." : "Login"}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
        <Link to="/login" style={{ color: '#64748b', textDecoration: 'none' }}>← Back to Member Login</Link>
      </div>
    </div>
  );
}