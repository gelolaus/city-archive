import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [historyFilter, setHistoryFilter] = useState("all");

  // We are mocking this data for now until we build the backend endpoint!
  const [dashboardData] = useState({
    totalFinesPaid: 150.00,
    overdueBooks: [
      { id: 101, title: "Database Systems", dueDate: "2026-02-20", fine: 50.00 }
    ],
    currentLoans: [
      { id: 102, title: "Clean Code", dueDate: "2026-03-01", status: "Active" }
    ],
    history: [
      { id: 103, title: "The Pragmatic Programmer", returnedOn: "2026-01-15" }
    ]
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("session_id");
    navigate("/login");
  };

  // Feature 5: Quick Search that redirects to Catalog
  const handleQuickSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?keyword=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate(`/catalog`);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      {/* Header & Logout */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ccc', paddingBottom: '10px', marginBottom: '20px' }}>
        <h2>Member Dashboard</h2>
        <button onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Logout
        </button>
      </div>

      {/* Feature 5: Quick Search Bar */}
      <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ marginTop: 0 }}>Quick Catalog Search</h3>
        <form onSubmit={handleQuickSearch} style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search the library catalog..." 
            style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Find Books
          </button>
        </form>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Main Column */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Feature 1: Overdue Books (Critical Priority) */}
          <div style={{ border: '2px solid #ef4444', borderRadius: '8px', padding: '15px', backgroundColor: '#fef2f2' }}>
            <h3 style={{ color: '#b91c1c', marginTop: 0 }}>⚠️ Critical: Overdue Books</h3>
            {dashboardData.overdueBooks.length === 0 ? <p>No overdue books.</p> : 
              dashboardData.overdueBooks.map(book => (
                <div key={book.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #fca5a5', paddingBottom: '10px' }}>
                  <div><strong>{book.title}</strong><br/><small>Due: {book.dueDate}</small></div>
                  <div style={{ color: '#b91c1c', fontWeight: 'bold' }}>Fine: ₱{book.fine.toFixed(2)}</div>
                </div>
              ))
            }
          </div>

          {/* Feature 2: Currently Borrowed */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px' }}>
            <h3 style={{ marginTop: 0 }}>Currently Checked Out</h3>
            {dashboardData.currentLoans.map(book => (
              <div key={book.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                <span>{book.title}</span>
                <span style={{ color: '#059669' }}>Due: {book.dueDate}</span>
              </div>
            ))}
          </div>

          {/* Feature 3: Borrowing History with Filters */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ marginTop: 0 }}>Borrowing History</h3>
              <select value={historyFilter} onChange={(e) => setHistoryFilter(e.target.value)} style={{ padding: '5px' }}>
                <option value="all">All Time</option>
                <option value="1m">Last Month</option>
                <option value="3m">Last 3 Months</option>
                <option value="9m">Last 9 Months</option>
                <option value="1y">Last Year</option>
              </select>
            </div>
            {dashboardData.history.map(book => (
              <div key={book.id} style={{ padding: '5px 0', borderBottom: '1px dashed #ccc' }}>
                {book.title} <span style={{ color: '#666', fontSize: '0.9em', float: 'right' }}>Returned: {book.returnedOn}</span>
              </div>
            ))}
          </div>

        </div>

        {/* Side Column for Stats */}
        <div style={{ flex: 1 }}>
          
          {/* Feature 4: Total Fines Paid */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', backgroundColor: '#f8fafc', textAlign: 'center' }}>
            <h3 style={{ marginTop: 0, color: '#475569' }}>Total Fines Paid</h3>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0f172a' }}>
              ₱{dashboardData.totalFinesPaid.toFixed(2)}
            </div>
            <small style={{ color: '#64748b' }}>Lifetime account history</small>
          </div>

        </div>
      </div>

    </div>
  );
}