import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

export default function SystemDiagnostics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [healthData, setHealthData] = useState<any>(null);

  const scanSystem = async () => {
    setLoading(true); setError(""); setSuccess("");
    try {
      const res = await api.get("/books/system/diagnostics", {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setHealthData(res.data.data);
      if (res.data.data.isHealthy) {
        setSuccess("Scan complete: Architecture is perfectly synchronized. 100% Health.");
      } else {
        setError(`Warning: Split-Brain detected! Found ${res.data.data.mysqlOrphans.length} MySQL orphans and ${res.data.data.mongoOrphans.length} MongoDB ghosts.`);
      }
    } catch (err) {
      setError("Failed to communicate with diagnostic nodes.");
    } finally {
      setLoading(false);
    }
  };

  // Run a scan automatically when the page loads
  useEffect(() => { scanSystem(); }, []);

  const triggerAutoRepair = async () => {
    if (!window.confirm("WARNING: This will automatically mutate MongoDB to match MySQL's primary keys. Proceed?")) return;
    
    setLoading(true); setError(""); setSuccess("");
    try {
      await api.post("/books/system/repair", {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setSuccess("Auto-Repair successful! All data structures have been aligned.");
      scanSystem(); // Re-scan to prove it worked
    } catch (err) {
      setError("Auto-Repair failed. Manual database intervention required.");
    } finally {
      setLoading(false);
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
          <Link to="/admin/borrow" style={{ color: 'white', textDecoration: 'none' }}>🤝 Issue a Loan</Link>
          <Link to="/admin/return" style={{ color: 'white', textDecoration: 'none' }}>📥 Process Return</Link>
          <Link to="/admin/fines" style={{ color: 'white', textDecoration: 'none' }}>💰 Settle Fines</Link>
          <Link to="/admin/diagnostics" style={{ color: '#38bdf8', textDecoration: 'none' }}>🛠️ Diagnostics</Link>
          <button onClick={handleLogout} style={{ marginTop: '50px', backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
        </nav>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '40px' }}>
        <h2>System Diagnostics & Sync</h2>
        <p style={{ color: '#64748b', marginTop: '-10px', marginBottom: '30px' }}>Monitor and repair polyglot persistence integrity.</p>

        <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
            <button onClick={scanSystem} disabled={loading} style={{ padding: '12px 24px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'wait' : 'pointer', fontWeight: 'bold' }}>
              {loading ? "Scanning..." : "📡 Run Deep Scan"}
            </button>
            {healthData && !healthData.isHealthy && (
                <button onClick={triggerAutoRepair} disabled={loading} style={{ padding: '12px 24px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'wait' : 'pointer', fontWeight: 'bold' }}>
                  🔧 Execute Auto-Repair
                </button>
            )}
        </div>

        {error && <div style={{ color: '#b91c1c', marginBottom: '15px', padding: '15px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '4px', maxWidth: '800px', fontWeight: 'bold' }}>{error}</div>}
        {success && <div style={{ color: '#15803d', marginBottom: '15px', padding: '15px', backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '4px', maxWidth: '800px', fontWeight: 'bold' }}>{success}</div>}

        {healthData && !healthData.isHealthy && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', maxWidth: '1000px' }}>
                {/* MySQL Orphans */}
                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', borderTop: '4px solid #f59e0b' }}>
                    <h3 style={{ marginTop: 0, color: '#b45309' }}>MySQL Orphans ({healthData.mysqlOrphans.length})</h3>
                    <p style={{ fontSize: '13px', color: '#64748b' }}>Books existing in SQL but missing rich MongoDB data.</p>
                    <ul style={{ fontSize: '14px', color: '#334155', paddingLeft: '20px' }}>
                        {healthData.mysqlOrphans.map((o: any) => <li key={o.book_id}>ID: {o.book_id} - {o.title}</li>)}
                    </ul>
                </div>

                {/* MongoDB Ghosts */}
                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', borderTop: '4px solid #8b5cf6' }}>
                    <h3 style={{ marginTop: 0, color: '#5b21b6' }}>MongoDB Ghosts ({healthData.mongoOrphans.length})</h3>
                    <p style={{ fontSize: '13px', color: '#64748b' }}>Rich documents that have no parent relational SQL row.</p>
                    <ul style={{ fontSize: '14px', color: '#334155', paddingLeft: '20px' }}>
                        {healthData.mongoOrphans.map((o: any) => <li key={o._id}>Mongo ID: {o.mysql_book_id}</li>)}
                    </ul>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}