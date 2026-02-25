import { useState, useEffect } from "react";
import api from "../api/axios";

export default function AuthorVault() {
  const [archives, setArchives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleRestore = async (archiveId: number) => {
    try {
        await api.post(`/books/admin/restore/authors/${archiveId}`, {}, {
            headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
        });
        alert("Author successfully returned to active status!");
        window.location.reload(); // Refresh the list
    } catch (err) {
        alert("Restoration failed. Ensure the author ID isn't already taken.");
    }
};

  useEffect(() => {
    const fetchVault = async () => {
      try {
        const res = await api.get("/books/admin/archive/authors", {
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
        });
        setArchives(res.data.data);
      } catch (err) {
        setError("Failed to access the Author Vault.");
      } finally {
        setLoading(false);
      }
    };
    fetchVault();
  }, []);

  return (
    <div style={{ fontFamily: 'sans-serif', backgroundColor: '#f8fafc' }}>
      <h2>🗄️ Author Archive Vault</h2>
      <p style={{ color: '#64748b' }}>Author records pending permanent deletion.</p>

      {error && (
        <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>
      )}

      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
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
              <th style={{ padding: '15px 20px' }}>Original ID</th>
              <th style={{ padding: '15px 20px' }}>Author Name</th>
              <th style={{ padding: '15px 20px' }}>Archived On</th>
              <th style={{ padding: '15px 20px', color: '#dc2626' }}>Purge Date</th>
              <th style={{ padding: '15px 20px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: '20px', textAlign: 'center' }}>
                  Loading...
                </td>
              </tr>
            ) : archives.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '20px', textAlign: 'center' }}>
                  Vault empty.
                </td>
              </tr>
            ) : (
              archives.map((arc) => {
                const payload =
                  typeof arc.record_payload === 'string'
                    ? JSON.parse(arc.record_payload)
                    : arc.record_payload;
                return (
                  <tr
                    key={arc.archive_id}
                    style={{ borderBottom: '1px solid #e2e8f0' }}
                  >
                    <td style={{ padding: '15px 20px' }}>#{arc.original_id}</td>
                    <td style={{ padding: '15px 20px' }}>
                      <strong>
                        {payload.first_name} {payload.last_name}
                      </strong>
                    </td>
                    <td style={{ padding: '15px 20px' }}>{arc.archived_date}</td>
                    <td
                      style={{
                        padding: '15px 20px',
                        color: '#dc2626',
                        fontWeight: 'bold',
                      }}
                    >
                      {arc.deletion_date}
                    </td>
                    <td style={{ padding: '15px 20px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleRestore(arc.archive_id)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                        }}
                      >
                        Restore
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}