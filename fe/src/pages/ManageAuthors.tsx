import { useState, useEffect, type FormEvent } from "react";
import api from "../api/axios";

// ... (keep your existing types and state variables)
type Author = { author_id: number; first_name: string; last_name: string; };
type AuthorArchiveRecord = { archive_id: number; original_id: number; record_payload: any; archived_date: string; deletion_date: string; };

export default function ManageAuthors() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [archives, setArchives] = useState<AuthorArchiveRecord[]>([]);
  const [loadingAuthors, setLoadingAuthors] = useState(true);
  const [loadingArchives, setLoadingArchives] = useState(true);
  const [authorSearch, setAuthorSearch] = useState("");
  const [archiveSearch, setArchiveSearch] = useState("");

  // Add Author State
  const [addForm, setAddForm] = useState({ first_name: "", last_name: "" });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");

  const [manageError, setManageError] = useState("");
  const [manageSuccess, setManageSuccess] = useState("");
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);
  const [editForm, setEditForm] = useState({ first_name: "", last_name: "" });
  const [archiveError, setArchiveError] = useState("");
  const [archiveSuccess, setArchiveSuccess] = useState("");

  // Simple client-side pagination
  const [authorPage, setAuthorPage] = useState(1);
  const [archivePage, setArchivePage] = useState(1);
  const PAGE_SIZE = 10;

  const refreshAuthors = async () => { /* ... existing logic ... */
    setLoadingAuthors(true); setManageError("");
    try {
      const res = await api.get("/books/admin/authors", { headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` } });
      setAuthors(res.data.data);
    } catch (err) { setManageError("Failed to fetch authors list."); } 
    finally { setLoadingAuthors(false); }
  };
  const refreshArchives = async () => { /* ... existing logic ... */ 
    setLoadingArchives(true); setArchiveError("");
    try {
      const res = await api.get("/books/admin/archive/authors", { headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` } });
      setArchives(res.data.data);
    } catch (err) { setArchiveError("Failed to access the Author Vault."); } 
    finally { setLoadingArchives(false); }
  };
  useEffect(() => { void refreshAuthors(); void refreshArchives(); }, []);

  const filteredAuthors = authors.filter(a => {
    const s = authorSearch.toLowerCase();
    return `${a.first_name} ${a.last_name}`.toLowerCase().includes(s) || String(a.author_id).includes(s);
  });
  const totalAuthorPages = Math.max(1, Math.ceil(filteredAuthors.length / PAGE_SIZE));
  const pagedAuthors = filteredAuthors.slice((authorPage - 1) * PAGE_SIZE, authorPage * PAGE_SIZE);

  const filteredArchives = archives.filter(arc => {
    const s = archiveSearch.toLowerCase();
    const payload = typeof arc.record_payload === "string" ? JSON.parse(arc.record_payload) : arc.record_payload;
    return `${payload.first_name} ${payload.last_name}`.toLowerCase().includes(s) || String(arc.original_id).includes(s);
  });
  const totalArchivePages = Math.max(1, Math.ceil(filteredArchives.length / PAGE_SIZE));
  const pagedArchives = filteredArchives.slice((archivePage - 1) * PAGE_SIZE, archivePage * PAGE_SIZE);

  // NEW: Handle Add Author
  const handleAddSubmit = async (e: FormEvent) => {
    e.preventDefault(); setAddLoading(true); setAddError(""); setAddSuccess("");
    try {
      await api.post("/books/admin/authors/add", addForm, { headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` } });
      setAddSuccess("Author successfully added!");
      setAddForm({ first_name: "", last_name: "" });
      await refreshAuthors();
    } catch (err: any) {
      setAddError(err.response?.data?.message || "Failed to add author.");
    } finally { setAddLoading(false); }
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingAuthor) return;
    setManageError("");
    setManageSuccess("");
    try {
      await api.put(
        `/books/admin/authors/${editingAuthor.author_id}`,
        editForm,
        { headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` } },
      );
      setManageSuccess("Author updated successfully.");
      setEditingAuthor(null);
      await refreshAuthors();
    } catch (err: any) {
      setManageError(err.response?.data?.message || "Update failed.");
    }
  };
  const handleDelete = async (id: number, name: string) => { /* ... existing logic ... */ 
    if (!window.confirm(`Archive ${name}? They will be permanently deleted after 30 days.`)) return;
    setManageError(""); setManageSuccess("");
    try {
      await api.delete(`/books/admin/authors/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` } });
      setManageSuccess(`${name} moved to the vault for 30 days.`);
      await refreshAuthors(); await refreshArchives();
    } catch (err: any) { setManageError(err.response?.data?.message || "Archive failed."); }
  };
  const handleRestore = async (archiveId: number) => { /* ... existing logic ... */ 
    setArchiveError(""); setArchiveSuccess("");
    try {
      await api.post(`/books/admin/restore/authors/${archiveId}`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` } });
      setArchiveSuccess("Author restored to active directory.");
      await refreshArchives(); await refreshAuthors();
    } catch (err) { setArchiveError("Restoration failed."); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h2 style={{ fontSize: "26px", fontWeight: 600, margin: 0 }}>Author Registry</h2>
        <p style={{ color: "#64748b", marginTop: "6px", marginBottom: 0, fontSize: "14px" }}>
          Maintain the active list of authors used throughout the catalog.
        </p>
      </div>
      
      {/* NEW: ADD AUTHOR SECTION */}
      <section style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px 28px" }}>
        <h2 style={{ marginTop: 0, marginBottom: "4px", fontSize: "20px" }}>Add New Author</h2>
        <p style={{ color: "#64748b", marginTop: 0, marginBottom: "20px", fontSize: "14px" }}>Register a new author to make them available in the catalog dropdowns.</p>

        {addError && <div style={{ color: "#b91c1c", marginBottom: "15px", padding: "10px", backgroundColor: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "4px" }}>{addError}</div>}
        {addSuccess && <div style={{ color: "#15803d", marginBottom: "15px", padding: "10px", backgroundColor: "#f0fdf4", border: "1px solid #86efac", borderRadius: "4px" }}>{addSuccess}</div>}

        <form onSubmit={handleAddSubmit} style={{ display: "flex", gap: "16px", alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: "bold", fontSize: "14px" }}>First Name *</label>
            <input type="text" required value={addForm.first_name} onChange={(e) => setAddForm({ ...addForm, first_name: e.target.value })} style={{ width: "100%", padding: "10px", marginTop: "5px", boxSizing: "border-box", border: "1px solid #cbd5e1", borderRadius: "4px" }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: "bold", fontSize: "14px" }}>Last Name *</label>
            <input type="text" required value={addForm.last_name} onChange={(e) => setAddForm({ ...addForm, last_name: e.target.value })} style={{ width: "100%", padding: "10px", marginTop: "5px", boxSizing: "border-box", border: "1px solid #cbd5e1", borderRadius: "4px" }} />
          </div>
          <button type="submit" disabled={addLoading} style={{ padding: "10px 24px", backgroundColor: "#0f172a", color: "white", border: "none", cursor: "pointer", borderRadius: "4px", fontWeight: "bold", height: "40px" }}>
            {addLoading ? "Adding..." : "Add Author"}
          </button>
        </form>
      </section>

      {/* Existing Grid (Manage Authors | Archive Vault) */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)", gap: "24px", alignItems: "flex-start" }}>
        
        {/* MIDDLE: ACTIVE AUTHORS DIRECTORY */}
        <section style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "20px 24px" }}>
          <h2 style={{ margin: 0, fontSize: "18px" }}>Manage Authors</h2>
          <p style={{ margin: 0, marginTop: "4px", marginBottom: "14px", color: "#64748b", fontSize: "13px" }}>Active directory used across the catalog.</p>
          <input
            type="text"
            placeholder="Search authors by name or ID..."
            value={authorSearch}
            onChange={(e) => { setAuthorSearch(e.target.value); setAuthorPage(1); }}
            style={{ width: "100%", padding: "10px 12px", marginBottom: "12px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box", fontSize: "14px" }}
          />
          {manageError && <p style={{ color: "#dc2626", marginTop: 0 }}>{manageError}</p>}
          {manageSuccess && <p style={{ color: "#16a34a", marginTop: 0 }}>{manageSuccess}</p>}

          <div style={{ borderRadius: "8px", border: "1px solid #e2e8f0", overflow: "hidden", marginTop: "12px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ textAlign: "left", backgroundColor: "#f1f5f9", color: "#475569" }}>
                  <th style={{ padding: "12px 16px" }}>Author Name</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
              {loadingAuthors ? (<tr><td colSpan={2} style={{ padding: "16px", textAlign: "center" }}>Loading authors...</td></tr>) : filteredAuthors.length === 0 ? (<tr><td colSpan={2} style={{ padding: "16px", textAlign: "center" }}>No authors match.</td></tr>) : (
                  pagedAuthors.map((a) => (
                    <tr key={a.author_id} style={{ borderTop: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "12px 16px" }}>{a.first_name} {a.last_name}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                        <button onClick={() => { setEditingAuthor(a); setEditForm({ first_name: a.first_name, last_name: a.last_name }); }} style={{ marginRight: "8px", padding: "6px 10px", fontSize: "13px", borderRadius: "4px", border: "1px solid #cbd5f5", backgroundColor: "#ffffff", cursor: "pointer" }}>Edit</button>
                        <button onClick={() => handleDelete(a.author_id, `${a.first_name} ${a.last_name}`)} style={{ padding: "6px 10px", fontSize: "13px", borderRadius: "4px", border: "none", backgroundColor: "#fee2e2", color: "#b91c1c", cursor: "pointer" }}>Archive</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Authors pagination controls */}
          {filteredAuthors.length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", fontSize: "13px", color: "#64748b" }}>
              <span>
                Showing {(authorPage - 1) * PAGE_SIZE + 1}–
                {Math.min(authorPage * PAGE_SIZE, filteredAuthors.length)} of {filteredAuthors.length} authors
              </span>
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  type="button"
                  onClick={() => setAuthorPage((p) => Math.max(1, p - 1))}
                  disabled={authorPage === 1}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "4px",
                    border: "1px solid #cbd5e1",
                    backgroundColor: authorPage === 1 ? "#e5e7eb" : "white",
                    cursor: authorPage === 1 ? "default" : "pointer"
                  }}
                >
                  Previous
                </button>
                <span style={{ alignSelf: "center" }}>Page {authorPage} of {totalAuthorPages}</span>
                <button
                  type="button"
                  onClick={() => setAuthorPage((p) => Math.min(totalAuthorPages, p + 1))}
                  disabled={authorPage === totalAuthorPages}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "4px",
                    border: "1px solid #cbd5e1",
                    backgroundColor: authorPage === totalAuthorPages ? "#e5e7eb" : "white",
                    cursor: authorPage === totalAuthorPages ? "default" : "pointer"
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>

        {/* RIGHT: AUTHOR ARCHIVE VAULT */}
        <section style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "20px 24px" }}>
          <h2 style={{ margin: 0, fontSize: "18px" }}>Archive Vault</h2>
          <p style={{ marginTop: "4px", marginBottom: "14px", fontSize: "13px", color: "#64748b" }}>Soft-deleted records pending removal.</p>
          <input
            type="text"
            placeholder="Search archive..."
            value={archiveSearch}
            onChange={(e) => { setArchiveSearch(e.target.value); setArchivePage(1); }}
            style={{ width: "100%", padding: "10px 12px", marginBottom: "12px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box", fontSize: "14px" }}
          />
          {archiveError && <p style={{ color: "#dc2626", marginTop: 0 }}>{archiveError}</p>}
          {archiveSuccess && <p style={{ color: "#16a34a", marginTop: 0 }}>{archiveSuccess}</p>}

          <div style={{ borderRadius: "8px", border: "1px solid #e2e8f0", overflow: "hidden", marginTop: "12px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ backgroundColor: "#f1f5f9", color: "#475569" }}>
                  <th style={{ padding: "12px 14px" }}>Author Data</th>
                  <th style={{ padding: "12px 14px", color: "#dc2626" }}>Purge Date</th>
                  <th style={{ padding: "12px 14px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingArchives ? (<tr><td colSpan={3} style={{ padding: "16px", textAlign: "center" }}>Loading archive...</td></tr>) : filteredArchives.length === 0 ? (<tr><td colSpan={3} style={{ padding: "16px", textAlign: "center" }}>Vault empty or no match.</td></tr>) : (
                  pagedArchives.map((arc) => {
                    const payload = typeof arc.record_payload === "string" ? JSON.parse(arc.record_payload) : arc.record_payload;
                    return (
                      <tr key={arc.archive_id} style={{ borderTop: "1px solid #e2e8f0" }}>
                        <td style={{ padding: "12px 14px" }}><strong>{payload.first_name} {payload.last_name}</strong><br /><span style={{ color: "#64748b", fontSize: "11px" }}>ID: #{arc.original_id}</span></td>
                        <td style={{ padding: "12px 14px", color: "#dc2626", fontWeight: 600 }}>{arc.deletion_date}</td>
                        <td style={{ padding: "12px 14px", textAlign: "right" }}>
                          <button onClick={() => handleRestore(arc.archive_id)} style={{ padding: "6px 10px", backgroundColor: "#10b981", color: "#ffffff", borderRadius: "4px", border: "none", cursor: "pointer" }}>Restore</button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Archive pagination controls */}
          {filteredArchives.length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", fontSize: "13px", color: "#64748b" }}>
              <span>
                Showing {(archivePage - 1) * PAGE_SIZE + 1}–
                {Math.min(archivePage * PAGE_SIZE, filteredArchives.length)} of {filteredArchives.length} archived authors
              </span>
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  type="button"
                  onClick={() => setArchivePage((p) => Math.max(1, p - 1))}
                  disabled={archivePage === 1}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "4px",
                    border: "1px solid #cbd5e1",
                    backgroundColor: archivePage === 1 ? "#e5e7eb" : "white",
                    cursor: archivePage === 1 ? "default" : "pointer"
                  }}
                >
                  Previous
                </button>
                <span style={{ alignSelf: "center" }}>Page {archivePage} of {totalArchivePages}</span>
                <button
                  type="button"
                  onClick={() => setArchivePage((p) => Math.min(totalArchivePages, p + 1))}
                  disabled={archivePage === totalArchivePages}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "4px",
                    border: "1px solid #cbd5e1",
                    backgroundColor: archivePage === totalArchivePages ? "#e5e7eb" : "white",
                    cursor: archivePage === totalArchivePages ? "default" : "pointer"
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
        
      </div>

      {editingAuthor && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "12px", width: "400px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <h3 style={{ marginTop: 0 }}>Edit Author Information</h3>
            <form onSubmit={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "bold" }}>First Name</label>
                <input 
                  type="text" 
                  value={editForm.first_name} 
                  onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} 
                  style={{ width: "100%", padding: "8px", marginTop: "4px", border: "1px solid #cbd5e1", borderRadius: "4px" }} 
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "bold" }}>Last Name</label>
                <input 
                  type="text" 
                  value={editForm.last_name} 
                  onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} 
                  style={{ width: "100%", padding: "8px", marginTop: "4px", border: "1px solid #cbd5e1", borderRadius: "4px" }} 
                />
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button type="submit" style={{ flex: 1, padding: "10px", backgroundColor: "#0f172a", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Save Changes</button>
                <button type="button" onClick={() => setEditingAuthor(null)} style={{ flex: 1, padding: "10px", backgroundColor: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", borderRadius: "4px", cursor: "pointer" }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}