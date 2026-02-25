import { useNavigate, Link } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("role");
    navigate("/librarian-login");
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      {/* Sidebar */}
      <div style={{ width: '250px', backgroundColor: '#0f172a', color: 'white', padding: '20px' }}>
        <h3>Staff Panel</h3>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '30px' }}>
          <Link to="/admin/dashboard" style={{ color: '#38bdf8', textDecoration: 'none' }}>📊 Stats Overview</Link>
          <Link to="/add-book" style={{ color: 'white', textDecoration: 'none' }}>📚 Add New Book</Link>
          <Link to="/admin/borrow" style={{ color: 'white', textDecoration: 'none' }}>🤝 Issue a Loan</Link>
          <button onClick={handleLogout} style={{ marginTop: '50px', backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
        </nav>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '40px', backgroundColor: '#f8fafc' }}>
        <h1>Librarian Command Center</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '20px' }}>
          <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h3>Total Books</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>Fetching...</p>
          </div>
          <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h3>Active Loans</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>Fetching...</p>
          </div>
          <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h3>Unpaid Fines</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>Fetching...</p>
          </div>
        </div>
      </div>
    </div>
  );
}