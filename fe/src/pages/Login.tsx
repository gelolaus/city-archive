import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

export default function Login() {
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
      // 1. Send the payload to our Node.js backend
      const response = await api.post("/members/login", { 
          identifier: identifier, 
          password: password 
      });

      // 2. Save the VIP passes
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('session_id', response.data.session_id);

      // 3. Go to the dashboard
      navigate("/dashboard");

    } catch (err: any) {
      const msg = err.response?.data?.message || "Invalid credentials. Check your backend server.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '50px', maxWidth: '300px', margin: '50px auto', fontFamily: 'sans-serif', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>System Login</h2>
      
      {error && (
        <div style={{ color: 'red', marginBottom: '15px', padding: '10px', backgroundColor: '#ffe6e6', border: '1px solid red' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={{ fontWeight: 'bold' }}>Username / Email:</label>
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
        New here? <Link to="/register" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 'bold' }}>Register an account</Link>
      </div>
      
    </div>
  );
}