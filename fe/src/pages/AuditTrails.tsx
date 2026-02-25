import { useState, useEffect } from "react";
import api from "../api/axios";

export default function AuditTrails() {
  const [logs, setLogs] = useState<any[]>([]);
  const [filters, setFilters] = useState({ action: "", entity: "", search: "" });
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const fetchLogs = async () => {
    const params = new URLSearchParams(filters).toString();
    try {
        const res = await api.get(`/books/admin/audit-logs?${params}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
        });
        setLogs(res.data.data);
        setPage(1);
    } catch (error) {
        console.error("Failed to fetch logs", error);
    }
  };

  useEffect(() => { fetchLogs(); }, [filters]);

  const totalPages = Math.max(1, Math.ceil(logs.length / PAGE_SIZE));
  const pagedLogs = logs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div style={{ padding: '40px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <h2 style={{marginTop: 0}}>📋 Administrative Audit Trails</h2>
      <p style={{ color: '#64748b', marginTop: '-10px', marginBottom: '30px' }}>
        Immutable log of all staff actions and system events.
      </p>
      
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
      <input
        style={{flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px'}}
        placeholder="Search details..."
        onChange={e => {
          setPage(1);
          setFilters(prev => ({ ...prev, search: e.target.value }));
        }}
      />
      <select
        style={{padding: '8px', border: '1px solid #ccc', borderRadius: '4px'}}
        onChange={e => {
          setPage(1);
          setFilters(prev => ({ ...prev, action: e.target.value }));
        }}
      >
          <option value="">All Actions</option>
          <option value="BOOK_ADD">Book Added</option>
          <option value="BOOK_UPDATE">Book Updated</option>
          <option value="BOOK_ARCHIVE">Book Archived</option>
          <option value="BOOK_RESTORE">Book Restored</option>
          <option value="AUTHOR_UPDATE">Author Updated</option>
          <option value="AUTHOR_ARCHIVE">Author Archived</option>
          <option value="AUTHOR_RESTORE">Author Restored</option>
          <option value="BORROW_INITIATED">Loan Issued</option>
          <option value="BOOK_RETURNED">Loan Returned</option>
          <option value="FINE_SETTLED">Fine Settled</option>
        </select>
      <select
        style={{padding: '8px', border: '1px solid #ccc', borderRadius: '4px'}}
        onChange={e => {
          setPage(1);
          setFilters(prev => ({ ...prev, entity: e.target.value }));
        }}
      >
          <option value="">All Entities</option>
          <option value="BOOK">Books</option>
          <option value="AUTHOR">Authors</option>
          <option value="LOAN">Loans</option>
          <option value="FINE">Fines</option>
        </select>
      </div>

      <div style={{backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden'}}>
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', fontSize: '14px', textAlign: 'left' }}>
            <thead>
            <tr style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                <th style={{ padding: '15px' }}>Timestamp</th>
                <th style={{ padding: '15px' }}>Librarian</th>
                <th style={{ padding: '15px' }}>Action</th>
                <th style={{ padding: '15px' }}>Details</th>
            </tr>
            </thead>
            <tbody>
            {logs.length === 0 ? (
                <tr>
                    <td colSpan={4} style={{padding: '20px', textAlign: 'center', color: '#64748b'}}>No audit logs found.</td>
                </tr>
            ) : pagedLogs.map(log => (
                <tr key={log._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '15px', color: '#64748b' }}>{new Date(log.timestamp).toLocaleString()}</td>
                <td style={{ padding: '15px' }}><strong>{log.username}</strong><br/><small style={{color: '#64748b'}}>ID: {log.librarian_id}</small></td>
                <td style={{ padding: '15px' }}><span style={{ backgroundColor: '#f1f5f9', color: '#0f172a', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px' }}>{log.action}</span></td>
                <td style={{ padding: '15px', color: '#334155' }}>{log.details}</td>
                </tr>
            ))}
            </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {logs.length > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", fontSize: "13px", color: "#64748b" }}>
          <span>
            Showing {(page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, logs.length)} of {logs.length} audit entries
          </span>
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: "6px 10px",
                borderRadius: "4px",
                border: "1px solid #cbd5e1",
                backgroundColor: page === 1 ? "#e5e7eb" : "white",
                cursor: page === 1 ? "default" : "pointer"
              }}
            >
              Previous
            </button>
            <span style={{ alignSelf: "center" }}>Page {page} of {totalPages}</span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                padding: "6px 10px",
                borderRadius: "4px",
                border: "1px solid #cbd5e1",
                backgroundColor: page === totalPages ? "#e5e7eb" : "white",
                cursor: page === totalPages ? "default" : "pointer"
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}