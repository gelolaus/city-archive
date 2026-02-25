import { useState, useEffect } from "react";
import api from "../api/axios";

export default function ManageMembers() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // --- Edit Modal State ---
  const [editingMember, setEditingMember] = useState<any>(null);
  const [editForm, setEditForm] = useState({ 
    first_name: "", 
    last_name: "", 
    email: "", 
    phone_number: "",
    password: "" // New: Plain-text password field
  });

  const fetchMembers = async () => {
    try {
      const res = await api.get("/members/admin/list", {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setMembers(res.data.data);
    } catch (err) {
      setError("Failed to fetch member list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMembers(); }, []);

  // --- Edit Handlers ---
  const openEditModal = (member: any) => {
    setEditingMember(member);
    setEditForm({
      first_name: member.first_name,
      last_name: member.last_name,
      email: member.email,
      phone_number: member.phone_number,
      password: "" // Kept blank; only fill if changing
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    try {
      // Send the form directly (includes plain-text password if provided)
      await api.put(`/members/admin/update/${editingMember.member_id}`, editForm, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setSuccess(`Profile for ${editForm.first_name} updated successfully.`);
      setEditingMember(null);
      fetchMembers();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update member.");
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    const action = currentStatus ? "suspend" : "activate";
    if (!window.confirm(`Are you sure you want to ${action} this member?`)) return;

    setError(""); setSuccess("");

    try {
        await api.patch(`/members/admin/toggle-status/${id}`, 
            { status: !currentStatus }, 
            { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }
        );
        setSuccess(`Account successfully ${currentStatus ? 'suspended' : 'activated'}.`);
        fetchMembers(); 
    } catch (err: any) {
        setError("Failed to update member status.");
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <h2>Member Directory</h2>
      <p style={{ color: '#64748b', marginTop: '-10px', marginBottom: '30px' }}>
        Monitor account status and manage library access permissions.
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
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left' }}>
              <th style={{ padding: '15px' }}>Member Name</th>
              <th style={{ padding: '15px' }}>Email</th>
              <th style={{ padding: '15px' }}>Status</th>
              <th style={{ padding: '15px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    padding: '20px',
                    textAlign: 'center',
                    color: '#64748b',
                  }}
                >
                  Loading member directory...
                </td>
              </tr>
            ) : (
              members.map((m) => (
                <tr key={m.member_id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '15px' }}>
                    <span style={{ fontWeight: 'bold' }}>
                      {m.first_name} {m.last_name}
                    </span>
                    <br />
                    <small style={{ color: '#64748b' }}>@{m.username}</small>
                  </td>
                  <td style={{ padding: '15px' }}>{m.email}</td>
                  <td style={{ padding: '15px' }}>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        backgroundColor: m.is_active ? '#dcfce7' : '#fee2e2',
                        color: m.is_active ? '#15803d' : '#b91c1c',
                        fontWeight: 'bold',
                      }}
                    >
                      {m.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td style={{ padding: '15px', textAlign: 'right' }}>
                    <button
                      onClick={() => openEditModal(m)}
                      style={{
                        marginRight: '15px',
                        color: '#0f172a',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() =>
                        handleToggleStatus(m.member_id, m.is_active)
                      }
                      style={{
                        color: m.is_active ? '#dc2626' : '#10b981',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '14px',
                      }}
                    >
                      {m.is_active ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- EDIT MODAL --- */}
      {editingMember && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '8px',
              width: '400px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              Edit Member: {editingMember.username}
            </h3>
            <form
              onSubmit={handleUpdate}
              style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
            >
              <div>
                <label
                  style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#64748b',
                  }}
                >
                  First Name:
                </label>
                <input
                  type="text"
                  value={editForm.first_name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, first_name: e.target.value })
                  }
                  style={{
                    width: '100%',
                    padding: '8px',
                    marginTop: '5px',
                    borderRadius: '4px',
                    border: '1px solid #e2e8f0',
                  }}
                  required
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#64748b',
                  }}
                >
                  Last Name:
                </label>
                <input
                  type="text"
                  value={editForm.last_name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, last_name: e.target.value })
                  }
                  style={{
                    width: '100%',
                    padding: '8px',
                    marginTop: '5px',
                    borderRadius: '4px',
                    border: '1px solid #e2e8f0',
                  }}
                  required
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#64748b',
                  }}
                >
                  Email:
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  style={{
                    width: '100%',
                    padding: '8px',
                    marginTop: '5px',
                    borderRadius: '4px',
                    border: '1px solid #e2e8f0',
                  }}
                  required
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#64748b',
                  }}
                >
                  Phone Number:
                </label>
                <input
                  type="text"
                  value={editForm.phone_number}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phone_number: e.target.value })
                  }
                  style={{
                    width: '100%',
                    padding: '8px',
                    marginTop: '5px',
                    borderRadius: '4px',
                    border: '1px solid #e2e8f0',
                  }}
                  required
                />
              </div>
              {/* --- New: Plain Text Password Field --- */}
              <div>
                <label
                  style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#64748b',
                  }}
                >
                  New Password (leave blank to keep current):
                </label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) =>
                    setEditForm({ ...editForm, password: e.target.value })
                  }
                  style={{
                    width: '100%',
                    padding: '8px',
                    marginTop: '5px',
                    borderRadius: '4px',
                    border: '1px solid #e2e8f0',
                  }}
                  placeholder="Overwrite current password"
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  marginTop: '10px',
                }}
              >
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#0f172a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#e2e8f0',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}