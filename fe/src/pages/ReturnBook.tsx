import { useState, useEffect } from "react";
import api from "../api/axios";

export default function ReturnBook() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Member Search State
  const [memberQuery, setMemberQuery] = useState("");
  const [memberResults, setMemberResults] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  // Active Loans State
  const [activeLoans, setActiveLoans] = useState<any[]>([]);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Real-time member search
  useEffect(() => {
    if (memberQuery.length > 1 && !selectedMember) {
      api.get(`/members/search?keyword=${memberQuery}`)
         .then(res => setMemberResults(res.data.data))
         .catch(err => console.error(err));
    } else {
      setMemberResults([]);
    }
  }, [memberQuery, selectedMember]);

  // Fetch loans when a member is selected
  const fetchMemberLoans = async (memberId: number) => {
    try {
      const res = await api.get(`/books/loans/member/${memberId}`);
      setActiveLoans(res.data.data);
    } catch (err) {
      setError("Failed to fetch member's active loans.");
    }
  };

  const handleSelectMember = (member: any) => {
    setSelectedMember(member);
    setMemberResults([]);
    setMemberQuery("");
    fetchMemberLoans(member.member_id);
  };

  const handleReturn = async (loanId: number, bookTitle: string) => {
    setProcessingId(loanId);
    setError("");
    setSuccess("");

    try {
      // Execute the return transaction
      await api.post(`/books/return/${loanId}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      
      setSuccess(`Success! "${bookTitle}" has been returned to the catalog.`);
      
      // Refresh the active loans list
      if (selectedMember) {
        fetchMemberLoans(selectedMember.member_id);
      }
    } catch (err: any) {
      setError(err.response?.data?.database_error || err.response?.data?.message || "Failed to process return.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div>
      <h2>Process Book Return</h2>
      <p style={{ color: '#64748b', marginTop: '-10px', marginBottom: '30px' }}>Clear a member's active loan and restock inventory.</p>

      {error && <div style={{ color: '#b91c1c', marginBottom: '15px', padding: '10px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '4px', maxWidth: '700px' }}>{error}</div>}
      {success && <div style={{ color: '#15803d', marginBottom: '15px', padding: '10px', backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '4px', maxWidth: '700px' }}>{success}</div>}

      <div style={{ maxWidth: '700px', backgroundColor: 'white', padding: '30px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          
          {/* 1. MEMBER DROPDOWN */}
          <div style={{ position: 'relative', marginBottom: '30px' }}>
            <label style={{ fontWeight: 'bold', fontSize: '14px', display: 'block', marginBottom: '5px' }}>1. Find Member</label>
            {selectedMember ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                <span><strong>{selectedMember.full_name}</strong> (ID: {selectedMember.member_id})</span>
                <button type="button" onClick={() => { setSelectedMember(null); setActiveLoans([]); }} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: 'bold' }}>✕ Change</button>
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
                      <li key={m.member_id} onClick={() => handleSelectMember(m)} style={{ padding: '10px', borderBottom: '1px solid #eee', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}>
                        <strong>{m.full_name}</strong> <span style={{ color: '#64748b', fontSize: '12px' }}>- ID: {m.member_id} ({m.email})</span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>

          {/* 2. ACTIVE LOANS LIST */}
          {selectedMember && (
            <div>
              <label style={{ fontWeight: 'bold', fontSize: '14px', display: 'block', marginBottom: '10px' }}>2. Active Loans</label>
              
              {activeLoans.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', border: '1px dashed #cbd5e1', borderRadius: '4px' }}>
                  This member has no active loans.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {activeLoans.map(loan => (
                    <div key={loan.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: loan.status === 'Overdue' ? '#fef2f2' : '#fff' }}>
                      <div>
                        <strong style={{ display: 'block', fontSize: '16px' }}>{loan.title}</strong>
                        <span style={{ fontSize: '13px', color: loan.status === 'Overdue' ? '#dc2626' : '#64748b' }}>
                          {loan.status === 'Overdue' ? '⚠️ OVERDUE' : 'Active'} | Due: {loan.dueDate}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleReturn(loan.id, loan.title)}
                        disabled={processingId === loan.id}
                        style={{ padding: '8px 16px', backgroundColor: '#0ea5e9', color: 'white', border: 'none', borderRadius: '4px', cursor: processingId === loan.id ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                      >
                        {processingId === loan.id ? "Returning..." : "Process Return"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

      </div>
    </div>
  );
}