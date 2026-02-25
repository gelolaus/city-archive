import { useState, useEffect } from "react";
import api from "../api/axios";

export default function FineSettlement() {
  const [fines, setFines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchFines = async () => {
    try {
      const res = await api.get("/books/fines/unpaid", {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setFines(res.data.data);
    } catch (err) {
      setError("Failed to fetch fines list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFines(); }, []);

  const handleSettleFine = async (fineId: number, memberName: string, amount: number) => {
    setProcessingId(fineId);
    setError("");
    setSuccess("");

    try {
      await api.post(`/books/fines/settle/${fineId}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      
      setSuccess(`Success! Payment of ₱${amount.toFixed(2)} received from ${memberName}.`);
      fetchFines(); // Refresh the list!
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to process payment.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <h2>Fine Settlement Operations</h2>
      <p style={{ color: '#64748b', marginTop: '-10px', marginBottom: '30px' }}>
        Process penalty payments and clear member ledgers.
      </p>

      {error && (
        <div
          style={{
            color: '#b91c1c',
            marginBottom: '15px',
            padding: '10px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fca5a5',
            borderRadius: '4px',
            maxWidth: '800px',
          }}
        >
          {error}
        </div>
      )}
      {success && (
        <div
          style={{
            color: '#15803d',
            marginBottom: '15px',
            padding: '10px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: '4px',
            maxWidth: '800px',
          }}
        >
          {success}
        </div>
      )}

      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          maxWidth: '900px',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px',
            textAlign: 'left',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
              <th style={{ padding: '15px 20px', fontWeight: 'bold' }}>Member</th>
              <th style={{ padding: '15px 20px', fontWeight: 'bold' }}>Overdue Book</th>
              <th style={{ padding: '15px 20px', fontWeight: 'bold' }}>Issued Date</th>
              <th style={{ padding: '15px 20px', fontWeight: 'bold' }}>Amount Due</th>
              <th
                style={{
                  padding: '15px 20px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                }}
              >
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    padding: '20px',
                    textAlign: 'center',
                    color: '#64748b',
                  }}
                >
                  Loading records...
                </td>
              </tr>
            ) : fines.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    padding: '20px',
                    textAlign: 'center',
                    color: '#10b981',
                    fontWeight: 'bold',
                  }}
                >
                  All member accounts are completely settled! 🎉
                </td>
              </tr>
            ) : (
              fines.map((fine) => (
                <tr key={fine.fine_id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '15px 20px' }}>
                    <strong>{fine.member_name}</strong>
                    <br />
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      ID: {fine.member_id}
                    </span>
                  </td>
                  <td style={{ padding: '15px 20px', color: '#334155' }}>{fine.title}</td>
                  <td style={{ padding: '15px 20px', color: '#64748b' }}>{fine.issued_date}</td>
                  <td
                    style={{
                      padding: '15px 20px',
                      color: '#ef4444',
                      fontWeight: 'bold',
                      fontSize: '16px',
                    }}
                  >
                    ₱{parseFloat(fine.amount).toFixed(2)}
                  </td>
                  <td style={{ padding: '15px 20px', textAlign: 'center' }}>
                    <button
                      onClick={() =>
                        handleSettleFine(
                          fine.fine_id,
                          fine.member_name,
                          parseFloat(fine.amount),
                        )
                      }
                      disabled={processingId === fine.fine_id}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor:
                          processingId === fine.fine_id ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                      }}
                    >
                      {processingId === fine.fine_id ? 'Processing...' : 'Mark as Paid'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}