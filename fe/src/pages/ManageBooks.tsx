import { useState, useEffect, type FormEvent } from "react";
import api from "../api/axios";

type Book = { book_id: number; title: string; author: string; isbn: string; synopsis?: string; total_copies: number; };
type ArchiveRecord = { archive_id: number; original_id: number; record_payload: any; archived_date: string; deletion_date: string; };

export default function ManageBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [archives, setArchives] = useState<ArchiveRecord[]>([]);

  // --- Dropdown Data State ---
  const [authorsList, setAuthorsList] = useState<any[]>([]);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);

  const [loadingBooks, setLoadingBooks] = useState(true);
  const [loadingArchives, setLoadingArchives] = useState(true);

  const [bookSearch, setBookSearch] = useState("");
  const [archiveSearch, setArchiveSearch] = useState("");

  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");
  
  // Notice we now use strings for authorName and categoryName to support typing
  const [addForm, setAddForm] = useState({ title: "", isbn: "", authorName: "", categoryName: "", synopsis: "", coverImage: "", totalCopies: 1 });

  const [manageError, setManageError] = useState("");
  const [manageSuccess, setManageSuccess] = useState("");
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [editForm, setEditForm] = useState({ title: "", isbn: "", synopsis: "", totalCopies: 1 });

  const [archiveError, setArchiveError] = useState("");
  const [archiveSuccess, setArchiveSuccess] = useState("");

  const fetchData = async () => {
    setLoadingBooks(true); setLoadingArchives(true);
    try {
      const [booksRes, arcRes, authRes, catRes] = await Promise.all([
        api.get("/books/search?keyword=&type=all&status=all"),
        api.get("/books/admin/archive/books", { headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` } }),
        api.get("/books/admin/authors", { headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` } }),
        api.get("/books/categories")
      ]);
      setBooks(booksRes.data.data);
      setArchives(arcRes.data.data);
      setAuthorsList(authRes.data.data);
      setCategoriesList(catRes.data.data);
    } catch (err) {
      setManageError("Failed to fetch dashboard data.");
    } finally {
      setLoadingBooks(false); setLoadingArchives(false);
    }
  };

  useEffect(() => { void fetchData(); }, []);

  const filteredBooks = books.filter(b => {
    const s = bookSearch.toLowerCase();
    return b.title.toLowerCase().includes(s) || b.author.toLowerCase().includes(s) || b.isbn.includes(s) || String(b.book_id).includes(s);
  });

  const filteredArchives = archives.filter(arc => {
    const s = archiveSearch.toLowerCase();
    const payload = typeof arc.record_payload === "string" ? JSON.parse(arc.record_payload) : arc.record_payload;
    return payload.title?.toLowerCase().includes(s) || payload.isbn?.includes(s) || String(arc.original_id).includes(s);
  });

  const handleAddChange = (e: any) => {
    const { name, value } = e.target;
    setAddForm((prev) => ({ ...prev, [name]: name === "totalCopies" ? Number(value) : value }));
  };

  const handleAddSubmit = async (e: FormEvent) => {
    e.preventDefault(); setAddLoading(true); setAddError(""); setAddSuccess("");

    // 1. Verify Author Exists
    const selectedAuthor = authorsList.find(
      a => `${a.first_name} ${a.last_name}`.toLowerCase() === addForm.authorName.trim().toLowerCase()
    );

    if (!selectedAuthor) {
      setAddError("Author not found! Please add them in the 'Manage Authors' page first.");
      setAddLoading(false);
      return;
    }

    // 2. Check if Category exists, or if it's brand new
    const selectedCategory = categoriesList.find(
      c => c.category.toLowerCase() === addForm.categoryName.trim().toLowerCase()
    );

    const payload = {
      title: addForm.title,
      isbn: addForm.isbn,
      authorId: selectedAuthor.author_id,
      categoryId: selectedCategory ? selectedCategory.category_id : null, // Send ID if exists
      newCategoryName: selectedCategory ? null : addForm.categoryName.trim(), // Send string if new
      synopsis: addForm.synopsis,
      coverImage: addForm.coverImage,
      totalCopies: addForm.totalCopies
    };

    try {
      await api.post("/books/add", payload, { headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` } });
      setAddSuccess("Book successfully added to the catalog!");
      setAddForm({ title: "", isbn: "", authorName: "", categoryName: "", synopsis: "", coverImage: "", totalCopies: 1 });
      await fetchData(); // Refresh everything to get new categories if one was created
    } catch (err: any) {
      setAddError(err.response?.data?.message || "Failed to add book.");
    } finally { setAddLoading(false); }
  };

  const openEditModal = (book: Book) => {
    setEditingBook(book);
    setEditForm({ title: book.title, isbn: book.isbn, synopsis: book.synopsis || "", totalCopies: book.total_copies });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editingBook) return;
    setManageError(""); setManageSuccess("");
    try {
      await api.put(`/books/admin/manage/${editingBook.book_id}`, editForm, { headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` } });
      setManageSuccess(`"${editForm.title}" updated successfully.`);
      setEditingBook(null); await fetchData();
    } catch (err: any) { setManageError(err.response?.data?.message || "Failed to update book."); }
  };

  const handleDelete = async (bookId: number, title: string) => {
    if (!window.confirm(`Archive "${title}"? It will be permanently deleted in 30 days.`)) return;
    setManageError(""); setManageSuccess("");
    try {
      await api.delete(`/books/admin/manage/${bookId}`, { headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` } });
      setManageSuccess(`"${title}" moved to archive.`); await fetchData();
    } catch (err: any) { setManageError(err.response?.data?.message || "Failed to archive book."); }
  };

  const handleRestore = async (archiveId: number) => {
    setArchiveError(""); setArchiveSuccess("");
    try {
      await api.post(`/books/admin/restore/${archiveId}`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` } });
      setArchiveSuccess("Book restored successfully!"); await fetchData();
    } catch (err) { setArchiveError("Failed to restore book."); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* TOP: ADD NEW BOOK */}
      <section style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", padding: "24px 28px" }}>
        <h2 style={{ marginTop: 0, marginBottom: "4px", fontSize: "20px" }}>Add New Book</h2>
        <p style={{ color: "#64748b", marginTop: 0, marginBottom: "20px", fontSize: "14px" }}>Capture core catalog details and instantly make titles available.</p>

        {addError && <div style={{ color: "#b91c1c", marginBottom: "15px", padding: "10px", backgroundColor: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "4px" }}>{addError}</div>}
        {addSuccess && <div style={{ color: "#15803d", marginBottom: "15px", padding: "10px", backgroundColor: "#f0fdf4", border: "1px solid #86efac", borderRadius: "4px" }}>{addSuccess}</div>}

        <form onSubmit={handleAddSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
            <div style={{ flex: 2, minWidth: "220px" }}>
              <label style={{ fontWeight: "bold", fontSize: "14px" }}>Book Title *</label>
              <input type="text" name="title" required value={addForm.title} onChange={handleAddChange} style={{ width: "100%", padding: "10px", marginTop: "5px", boxSizing: "border-box", border: "1px solid #cbd5e1", borderRadius: "4px" }} />
            </div>
            <div style={{ flex: 1, minWidth: "180px" }}>
              <label style={{ fontWeight: "bold", fontSize: "14px" }}>ISBN *</label>
              <input type="text" name="isbn" required value={addForm.isbn} onChange={handleAddChange} placeholder="978-3..." style={{ width: "100%", padding: "10px", marginTop: "5px", boxSizing: "border-box", border: "1px solid #cbd5e1", borderRadius: "4px" }} />
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
            {/* AUTOPLETE / COMBOBOX FOR AUTHOR */}
            <div style={{ flex: 1, minWidth: "180px" }}>
              <label style={{ fontWeight: "bold", fontSize: "14px" }}>Author *</label>
              <input 
                list="authors-list" 
                name="authorName" 
                required 
                value={addForm.authorName} 
                onChange={handleAddChange} 
                placeholder="Type or select author..."
                style={{ width: "100%", padding: "10px", marginTop: "5px", boxSizing: "border-box", border: "1px solid #cbd5e1", borderRadius: "4px" }} 
              />
              <datalist id="authors-list">
                {authorsList.map(a => <option key={a.author_id} value={`${a.first_name} ${a.last_name}`} />)}
              </datalist>
            </div>

            {/* AUTOPLETE / COMBOBOX FOR CATEGORY */}
            <div style={{ flex: 1, minWidth: "180px" }}>
              <label style={{ fontWeight: "bold", fontSize: "14px" }}>Category *</label>
              <input 
                list="categories-list" 
                name="categoryName" 
                required 
                value={addForm.categoryName} 
                onChange={handleAddChange} 
                placeholder="Type or create new..."
                style={{ width: "100%", padding: "10px", marginTop: "5px", boxSizing: "border-box", border: "1px solid #cbd5e1", borderRadius: "4px" }} 
              />
              <datalist id="categories-list">
                {categoriesList.map(c => <option key={c.category_id} value={c.category} />)}
              </datalist>
            </div>

            <div style={{ width: "160px" }}>
              <label style={{ fontWeight: "bold", fontSize: "14px" }}>Total Copies *</label>
              <input type="number" name="totalCopies" min={1} required value={addForm.totalCopies} onChange={handleAddChange} style={{ width: "100%", padding: "10px", marginTop: "5px", boxSizing: "border-box", border: "1px solid #cbd5e1", borderRadius: "4px" }} />
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
            <div style={{ flex: 1, minWidth: "220px" }}>
              <label style={{ fontWeight: "bold", fontSize: "14px" }}>Cover URL (Optional)</label>
              <input type="url" name="coverImage" value={addForm.coverImage} onChange={handleAddChange} placeholder="https://..." style={{ width: "100%", padding: "10px", marginTop: "5px", boxSizing: "border-box", border: "1px solid #cbd5e1", borderRadius: "4px" }} />
            </div>
            <div style={{ flex: 2, minWidth: "260px" }}>
              <label style={{ fontWeight: "bold", fontSize: "14px" }}>Synopsis (Optional)</label>
              <textarea name="synopsis" value={addForm.synopsis} onChange={handleAddChange} rows={3} style={{ width: "100%", padding: "10px", marginTop: "5px", boxSizing: "border-box", border: "1px solid #cbd5e1", borderRadius: "4px" }} />
            </div>
          </div>
          <button type="submit" disabled={addLoading} style={{ alignSelf: "flex-start", padding: "10px 16px", backgroundColor: "#0f172a", color: "white", border: "none", cursor: "pointer", borderRadius: "4px", fontWeight: "bold", marginTop: "4px" }}>
            {addLoading ? "Adding..." : "Add Book"}
          </button>
        </form>
      </section>

      {/* BOTTOM: MANAGE + ARCHIVE GRID */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "24px" }}>
        
        {/* MANAGE BOOKS */}
        <section style={{ flex: 1.1, minWidth: "340px", backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "20px 24px" }}>
          <h2 style={{ marginTop: 0, marginBottom: "4px", fontSize: "18px" }}>Manage Catalog</h2>
          <p style={{ color: "#64748b", marginTop: 0, marginBottom: "14px", fontSize: "13px" }}>Edit inventory details or archive books.</p>
          
          <input type="text" placeholder="Search catalog by title, author, ISBN..." value={bookSearch} onChange={(e) => setBookSearch(e.target.value)} style={{ width: "100%", padding: "10px 12px", marginBottom: "16px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box", fontSize: "14px" }} />

          {manageError && <div style={{ color: "#b91c1c", marginBottom: "15px", padding: "10px", backgroundColor: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "4px", fontWeight: "bold" }}>{manageError}</div>}
          {manageSuccess && <div style={{ color: "#15803d", marginBottom: "15px", padding: "10px", backgroundColor: "#f0fdf4", border: "1px solid #86efac", borderRadius: "4px", fontWeight: "bold" }}>{manageSuccess}</div>}

          <div style={{ backgroundColor: "white", borderRadius: "8px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", textAlign: "left" }}>
              <thead>
                <tr style={{ backgroundColor: "#f1f5f9", color: "#475569" }}>
                  <th style={{ padding: "12px 16px" }}>ID</th>
                  <th style={{ padding: "12px 16px" }}>Title & Author</th>
                  <th style={{ padding: "12px 16px" }}>ISBN</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingBooks ? (
                  <tr><td colSpan={4} style={{ padding: "20px", textAlign: "center" }}>Loading catalog...</td></tr>
                ) : filteredBooks.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: "20px", textAlign: "center", color: '#64748b' }}>No books match your search.</td></tr>
                ) : (
                  filteredBooks.map((book) => (
                    <tr key={book.book_id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "12px 16px", color: "#64748b" }}>#{book.book_id}</td>
                      <td style={{ padding: "12px 16px" }}><strong>{book.title}</strong><br /><span style={{ fontSize: "12px", color: "#64748b" }}>by {book.author}</span></td>
                      <td style={{ padding: "12px 16px", fontFamily: "monospace" }}>{book.isbn}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <button onClick={() => openEditModal(book)} style={{ marginRight: "8px", padding: "6px 12px", backgroundColor: "#e2e8f0", border: "none", borderRadius: "4px", cursor: "pointer" }}>Edit</button>
                        <button onClick={() => handleDelete(book.book_id, book.title)} style={{ padding: "6px 12px", backgroundColor: "#fee2e2", color: "#dc2626", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Archive</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ARCHIVE VAULT */}
        <section style={{ flex: 1, minWidth: "320px", backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "20px 24px" }}>
          <h2 style={{ marginTop: 0, marginBottom: "4px", fontSize: "18px" }}>Archive Vault</h2>
          <p style={{ color: "#64748b", marginTop: 0, marginBottom: "14px", fontSize: "13px" }}>Soft-deleted records pending purge.</p>
          
          <input type="text" placeholder="Search archives..." value={archiveSearch} onChange={(e) => setArchiveSearch(e.target.value)} style={{ width: "100%", padding: "10px 12px", marginBottom: "16px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box", fontSize: "14px" }} />

          {archiveError && <div style={{ color: "#b91c1c", marginBottom: "15px", padding: "10px", backgroundColor: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "4px", fontWeight: "bold" }}>{archiveError}</div>}
          {archiveSuccess && <div style={{ color: "#15803d", marginBottom: "15px", padding: "10px", backgroundColor: "#f0fdf4", border: "1px solid #86efac", borderRadius: "4px", fontWeight: "bold" }}>{archiveSuccess}</div>}

          <div style={{ backgroundColor: "white", borderRadius: "8px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", textAlign: "left" }}>
              <thead>
                <tr style={{ backgroundColor: "#f1f5f9", color: "#475569" }}>
                  <th style={{ padding: "12px 16px" }}>Data</th>
                  <th style={{ padding: "12px 16px", color: "#dc2626" }}>Purge Date</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingArchives ? (
                  <tr><td colSpan={3} style={{ padding: "20px", textAlign: "center" }}>Decrypting vault contents...</td></tr>
                ) : filteredArchives.length === 0 ? (
                  <tr><td colSpan={3} style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>Vault empty or no match.</td></tr>
                ) : (
                  filteredArchives.map((arc) => {
                    const payload = typeof arc.record_payload === "string" ? JSON.parse(arc.record_payload) : arc.record_payload;
                    return (
                      <tr key={arc.archive_id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                        <td style={{ padding: "12px 16px" }}><strong>{payload.title}</strong><br /><span style={{ fontSize: "12px", color: "#64748b", fontFamily: "monospace" }}>ID: #{arc.original_id}</span></td>
                        <td style={{ padding: "12px 16px", color: "#dc2626", fontWeight: "bold" }}>{arc.deletion_date}</td>
                        <td style={{ padding: "12px 16px", textAlign: "right" }}>
                          <button onClick={() => handleRestore(arc.archive_id)} style={{ padding: "6px 12px", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Restore</button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* EDIT MODAL */}
      {editingBook && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "8px", width: "400px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
            <h3 style={{ marginTop: 0 }}>Edit Book: {editingBook.book_id}</h3>
            <form onSubmit={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div><label>Title:</label><input type="text" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} style={{ width: "100%", padding: "8px", boxSizing: "border-box" }} required /></div>
              <div><label>ISBN:</label><input type="text" value={editForm.isbn} onChange={(e) => setEditForm({ ...editForm, isbn: e.target.value })} style={{ width: "100%", padding: "8px", boxSizing: "border-box" }} required /></div>
              <div><label>Synopsis:</label><textarea value={editForm.synopsis} onChange={(e) => setEditForm({ ...editForm, synopsis: e.target.value })} style={{ width: "100%", padding: "8px", boxSizing: "border-box", height: "80px" }} required /></div>
              <div><label>Total Copies:</label><input type="number" min={1} value={editForm.totalCopies} onChange={(e) => setEditForm({ ...editForm, totalCopies: Number(e.target.value) })} style={{ width: "100%", padding: "8px", boxSizing: "border-box" }} required /></div>
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}><button type="submit" style={{ flex: 1, padding: "10px", backgroundColor: "#0f172a", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>Save Changes</button><button type="button" onClick={() => setEditingBook(null)} style={{ flex: 1, padding: "10px", backgroundColor: "#e2e8f0", border: "none", borderRadius: "4px", cursor: "pointer" }}>Cancel</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}