import { useState, useEffect } from "react";
import api from "../api/axios";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [stats, setStats] = useState({
    totalBooks: "...", activeLoans: "...", unpaidFines: "...", systemViews: "..."
  });
  
  const [analytics, setAnalytics] = useState({
    topSearches: [], topViewed: [], topBorrowed: [], lowConversion: []
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/members/admin/stats", {
            headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
        });
        const data = res.data.data;
        
        setStats({
          totalBooks: data.totalBooks.toString(),
          activeLoans: data.activeLoans.toString(),
          unpaidFines: `₱${data.unpaidFines.toFixed(2)}`,
          systemViews: data.systemViews.toString()
        });

        setAnalytics({
            topSearches: data.topSearches,
            topViewed: data.topViewed,
            topBorrowed: data.topBorrowed,
            lowConversion: data.lowConversion
        });
      } catch (err) {
        setError("Failed to load live statistics.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Helper component for clean tables
  const StatTable = ({ title, data, columns, renderRow }: any) => (
    <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <div style={{ backgroundColor: '#f8fafc', padding: '15px 20px', borderBottom: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>{title}</h3>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
        <thead>
          <tr style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
            {columns.map((col: string, i: number) => <th key={i} style={{ padding: '12px 20px', fontWeight: 'bold' }}>{col}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan={columns.length} style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No data available yet.</td></tr>
          ) : (
            data.map((item: any, i: number) => renderRow(item, i))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <h2>Librarian Command Center</h2>
      <p style={{ color: '#64748b', marginTop: '-10px', marginBottom: '30px' }}>
        Live system diagnostics and behavioral analytics.
      </p>

      {error && <div style={{ color: '#b91c1c', marginBottom: '15px' }}>{error}</div>}

      {/* Top 4 KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '30px',
        }}
      >
        <div
          style={{
            padding: '20px',
            backgroundColor: 'white',
            borderRadius: '8px',
            borderTop: '4px solid #3b82f6',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <h3
            style={{
              margin: '0 0 10px 0',
              color: '#475569',
              fontSize: '14px',
              textTransform: 'uppercase',
            }}
          >
            Total Inventory
          </h3>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold' }}>{stats.totalBooks}</p>
        </div>
        <div
          style={{
            padding: '20px',
            backgroundColor: 'white',
            borderRadius: '8px',
            borderTop: '4px solid #f59e0b',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <h3
            style={{
              margin: '0 0 10px 0',
              color: '#475569',
              fontSize: '14px',
              textTransform: 'uppercase',
            }}
          >
            Active Loans
          </h3>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold' }}>{stats.activeLoans}</p>
        </div>
        <div
          style={{
            padding: '20px',
            backgroundColor: 'white',
            borderRadius: '8px',
            borderTop: '4px solid #ef4444',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <h3
            style={{
              margin: '0 0 10px 0',
              color: '#475569',
              fontSize: '14px',
              textTransform: 'uppercase',
            }}
          >
            Unpaid Fines
          </h3>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold' }}>{stats.unpaidFines}</p>
        </div>
        <div
          style={{
            padding: '20px',
            backgroundColor: 'white',
            borderRadius: '8px',
            borderTop: '4px solid #10b981',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <h3
            style={{
              margin: '0 0 10px 0',
              color: '#475569',
              fontSize: '14px',
              textTransform: 'uppercase',
            }}
          >
            Total Catalog Views
          </h3>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold' }}>{stats.systemViews}</p>
        </div>
      </div>

      {/* Detailed Analytics Tables */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <StatTable
            title="🏆 Most Borrowed Books"
            columns={["Title", "Borrows", "Avg Return Time"]}
            data={analytics.topBorrowed}
            renderRow={(item: any, i: number) => (
              <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px 20px', color: '#2563eb', fontWeight: 'bold' }}>{item.title}</td>
                <td style={{ padding: '12px 20px' }}>{item.total_borrows}</td>
                <td style={{ padding: '12px 20px' }}>
                  {item.avg_return_time_days > 0 ? `${item.avg_return_time_days} days` : 'N/A'}
                </td>
              </tr>
            )}
          />

          <StatTable
            title="👀 Most Viewed Books"
            columns={["Title", "Views", "Conversion Rate"]}
            data={analytics.topViewed}
            renderRow={(item: any, i: number) => (
              <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px 20px', color: '#2563eb', fontWeight: 'bold' }}>{item.title}</td>
                <td style={{ padding: '12px 20px' }}>{item.total_views}</td>
                <td style={{ padding: '12px 20px' }}>
                  {(item.conversion_rate * 100).toFixed(1)}%
                </td>
              </tr>
            )}
          />

          <StatTable
            title="⚠️ Missed Opportunities (High View, Low Borrow)"
            columns={["Title", "Views", "Borrows"]}
            data={analytics.lowConversion}
            renderRow={(item: any, i: number) => (
              <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px 20px', color: '#2563eb', fontWeight: 'bold' }}>{item.title}</td>
                <td style={{ padding: '12px 20px' }}>{item.total_views}</td>
                <td style={{ padding: '12px 20px', color: '#dc2626' }}>{item.total_borrows}</td>
              </tr>
            )}
          />

          <StatTable
            title="🔍 Top Search Queries"
            columns={["Query Data", "Search Count"]}
            data={analytics.topSearches}
            renderRow={(item: any, i: number) => {
              // Formatting the raw query string (e.g., "keyword:xyz|type:all") for better UI
              const cleanQuery = item.query.split('|')[0].replace('keyword:', '') || "Empty Search";
              return (
                <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td
                    style={{
                      padding: '12px 20px',
                      fontFamily: 'monospace',
                      backgroundColor: '#f8fafc',
                    }}
                  >
                    "{cleanQuery}"
                  </td>
                  <td style={{ padding: '12px 20px' }}>{item.count}</td>
                </tr>
              );
            }}
          />
        </div>
      )}
    </div>
  );
}