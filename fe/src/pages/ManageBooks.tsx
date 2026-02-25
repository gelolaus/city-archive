import { useState, useEffect, type FormEvent } from "react";
import api from "../api/axios";

type Book = {
  book_id: number;
  title: string;
  author: string;
  isbn: string;
  synopsis?: string;
  total_copies: number;
};

type ArchiveRecord = {
  archive_id: number;
  original_id: number;
  record_payload: any;
  archived_date: string;
  deletion_date: string;
};

export default function ManageBooks() {
  // Shared catalog + archive state
  const [books, setBooks] = useState<Book[]>([]);
  const [archives, setArchives] = useState<ArchiveRecord[]>([]);

  const [loadingBooks, setLoadingBooks] = useState(true);
  const [loadingArchives, setLoadingArchives] = useState(true);

  // Add section state
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");
  const [addForm, setAddForm] = useState({
    title: "",
    isbn: "",
    authorId: 1,
    categoryId: 2,
    synopsis: "",
    coverImage: "",
    totalCopies: 1,
  });

  // Manage section state
  const [manageError, setManageError] = useState("");
  const [manageSuccess, setManageSuccess] = useState("");
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    isbn: "",
    synopsis: "",
    totalCopies: 1,
  });

  // Archive section state
  const [archiveError, setArchiveError] = useState("");
  const [archiveSuccess, setArchiveSuccess] = useState("");

  const refreshBooks = async () => {
    setLoadingBooks(true);
    setManageError("");
    try {
      const res = await api.get("/books/search?keyword=&type=all&status=all");
      setBooks(res.data.data);
    } catch (err) {
      setManageError("Failed to fetch catalog.");
    } finally {
      setLoadingBooks(false);
    }
  };

  const refreshArchives = async () => {
    setLoadingArchives(true);
    setArchiveError("");
    try {
      const res = await api.get("/books/admin/archive/books", {
        headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
      });
      setArchives(res.data.data);
    } catch (err) {
      setArchiveError("Failed to access the Archive Vault.");
    } finally {
      setLoadingArchives(false);
    }
  };

  useEffect(() => {
    void refreshBooks();
    void refreshArchives();
  }, []);

  // ADD SECTION HANDLERS
  const handleAddChange = (e: any) => {
    const { name, value } = e.target;
    setAddForm((prev) => ({
      ...prev,
      [name]:
        name === "authorId" || name === "categoryId" || name === "totalCopies"
          ? Number(value)
          : value,
    }));
  };

  const handleAddSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError("");
    setAddSuccess("");

    try {
      await api.post("/books/add", {
        title: addForm.title,
        isbn: addForm.isbn,
        authorId: addForm.authorId,
        categoryId: addForm.categoryId,
        synopsis: addForm.synopsis,
        coverImage: addForm.coverImage,
        totalCopies: addForm.totalCopies,
      });
      setAddSuccess("Book successfully added to the catalog!");
      setAddForm((prev) => ({
        ...prev,
        title: "",
        isbn: "",
        synopsis: "",
        coverImage: "",
        totalCopies: 1,
      }));
      await refreshBooks();
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const zodErrors = err.response.data.errors;
        const firstErrorKey = Object.keys(zodErrors)[0];
        setAddError(`Validation Error: ${zodErrors[firstErrorKey][0]}`);
      } else {
        setAddError(
          err.response?.data?.message ||
            "Failed to add book. Please check your connection."
        );
      }
    } finally {
      setAddLoading(false);
    }
  };

  // MANAGE SECTION HANDLERS
  const openEditModal = (book: Book) => {
    setEditingBook(book);
    setEditForm({
      title: book.title,
      isbn: book.isbn,
      synopsis: book.synopsis || "",
      totalCopies: book.total_copies,
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook) return;

    setManageError("");
    setManageSuccess("");
    try {
      await api.put(
        `/books/admin/manage/${editingBook.book_id}`,
        {
          ...editForm,
          authorId: 1,
          categoryId: 1,
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` } }
      );

      setManageSuccess(`"${editForm.title}" updated successfully.`);
      setEditingBook(null);
      await refreshBooks();
    } catch (err: any) {
      setManageError(
        err.response?.data?.message || "Failed to update book."
      );
    }
  };

  const handleDelete = async (bookId: number, title: string) => {
    if (
      !window.confirm(
        `Are you sure you want to archive "${title}"? It will be permanently deleted in 30 days.`
      )
    )
      return;

    setManageError("");
    setManageSuccess("");
    try {
      await api.delete(`/books/admin/manage/${bookId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
      });
      setManageSuccess(`"${title}" has been moved to the archive vault.`);
      await refreshBooks();
      await refreshArchives();
    } catch (err: any) {
      setManageError(
        err.response?.data?.message || "Failed to archive book."
      );
    }
  };

  // ARCHIVE SECTION HANDLERS
  const handleRestore = async (archiveId: number) => {
    setArchiveError("");
    setArchiveSuccess("");
    try {
      await api.post(
        `/books/admin/restore/${archiveId}`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
        }
      );
      setArchiveSuccess("Book restored successfully!");
      await refreshArchives();
      await refreshBooks();
    } catch (err) {
      setArchiveError("Failed to restore book.");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
      }}
    >
      {/* TOP: ADD NEW BOOK */}
      <section
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          padding: "24px 28px",
        }}
      >
        <h2
          style={{
            marginTop: 0,
            marginBottom: "4px",
            fontSize: "20px",
          }}
        >
          Add New Book
        </h2>
        <p
          style={{
            color: "#64748b",
            marginTop: 0,
            marginBottom: "20px",
            fontSize: "14px",
          }}
        >
          Capture core catalog details and instantly make titles available in the
          staff console.
        </p>

        {addError && (
          <div
            style={{
              color: "#b91c1c",
              marginBottom: "15px",
              padding: "10px",
              backgroundColor: "#fef2f2",
              border: "1px solid #fca5a5",
              borderRadius: "4px",
            }}
          >
            {addError}
          </div>
        )}
        {addSuccess && (
          <div
            style={{
              color: "#15803d",
              marginBottom: "15px",
              padding: "10px",
              backgroundColor: "#f0fdf4",
              border: "1px solid #86efac",
              borderRadius: "4px",
            }}
          >
            {addSuccess}
          </div>
        )}

        <form
          onSubmit={handleAddSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {/* ROW 1: Title and ISBN */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div style={{ flex: 2, minWidth: "220px" }}>
              <label style={{ fontWeight: "bold", fontSize: "14px" }}>
                Book Title *
              </label>
              <input
                type="text"
                name="title"
                required
                value={addForm.title}
                onChange={handleAddChange}
                style={{
                  width: "100%",
                  padding: "10px",
                  marginTop: "5px",
                  boxSizing: "border-box",
                  border: "1px solid #cbd5e1",
                  borderRadius: "4px",
                }}
              />
            </div>
            <div style={{ flex: 1, minWidth: "180px" }}>
              <label style={{ fontWeight: "bold", fontSize: "14px" }}>ISBN *</label>
              <input
                type="text"
                name="isbn"
                required
                value={addForm.isbn}
                onChange={handleAddChange}
                placeholder="978-3-16-148410-0"
                style={{
                  width: "100%",
                  padding: "10px",
                  marginTop: "5px",
                  boxSizing: "border-box",
                  border: "1px solid #cbd5e1",
                  borderRadius: "4px",
                }}
              />
            </div>
          </div>

          {/* ROW 2: Author / Category */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div style={{ flex: 1, minWidth: "180px" }}>
              <label style={{ fontWeight: "bold", fontSize: "14px" }}>Author *</label>
              <select
                name="authorId"
                value={addForm.authorId}
                onChange={handleAddChange}
                style={{
                  width: "100%",
                  padding: "10px",
                  marginTop: "5px",
                  boxSizing: "border-box",
                  border: "1px solid #cbd5e1",
                  borderRadius: "4px",
                }}
              >
                <option value={1}>Jose Rizal</option>
                <option value={2}>J.K. Rowling</option>
                <option value={3}>George Orwell</option>
              </select>
            </div>
            <div style={{ flex: 1, minWidth: "180px" }}>
              <label style={{ fontWeight: "bold", fontSize: "14px" }}>
                Category *
              </label>
              <select
                name="categoryId"
                value={addForm.categoryId}
                onChange={handleAddChange}
                style={{
                  width: "100%",
                  padding: "10px",
                  marginTop: "5px",
                  boxSizing: "border-box",
                  border: "1px solid #cbd5e1",
                  borderRadius: "4px",
                }}
              >
                <option value={1}>Fantasy</option>
                <option value={2}>Fiction</option>
                <option value={3}>Non-Fiction</option>
                <option value={4}>Science</option>
                <option value={5}>History</option>
              </select>
            </div>
            <div style={{ width: "160px" }}>
              <label style={{ fontWeight: "bold", fontSize: "14px" }}>
                Total Copies *
              </label>
              <input
                type="number"
                name="totalCopies"
                min={1}
                required
                value={addForm.totalCopies}
                onChange={handleAddChange}
                style={{
                  width: "100%",
                  padding: "10px",
                  marginTop: "5px",
                  boxSizing: "border-box",
                  border: "1px solid #cbd5e1",
                  borderRadius: "4px",
                }}
              />
            </div>
          </div>

          {/* ROW 3: Cover + Synopsis */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div style={{ flex: 1, minWidth: "220px" }}>
              <label style={{ fontWeight: "bold", fontSize: "14px" }}>
                Cover Image URL (Optional)
              </label>
              <input
                type="url"
                name="coverImage"
                value={addForm.coverImage}
                onChange={handleAddChange}
                placeholder="https://example.com/cover.jpg"
                style={{
                  width: "100%",
                  padding: "10px",
                  marginTop: "5px",
                  boxSizing: "border-box",
                  border: "1px solid #cbd5e1",
                  borderRadius: "4px",
                }}
              />
            </div>
            <div style={{ flex: 2, minWidth: "260px" }}>
              <label style={{ fontWeight: "bold", fontSize: "14px" }}>
                Synopsis (Optional)
              </label>
              <textarea
                name="synopsis"
                value={addForm.synopsis}
                onChange={handleAddChange}
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px",
                  marginTop: "5px",
                  boxSizing: "border-box",
                  border: "1px solid #cbd5e1",
                  borderRadius: "4px",
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={addLoading}
            style={{
              alignSelf: "flex-start",
              padding: "10px 16px",
              backgroundColor: "#0f172a",
              color: "white",
              border: "none",
              cursor: "pointer",
              borderRadius: "4px",
              fontWeight: "bold",
              marginTop: "4px",
            }}
          >
            {addLoading ? "Adding to Databases..." : "Add Book to Catalog"}
          </button>
        </form>
      </section>

      {/* BOTTOM: MANAGE + ARCHIVE GRID */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "24px",
        }}
      >
        {/* MANAGE BOOKS */}
        <section
          style={{
            flex: 1.1,
            minWidth: "340px",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            padding: "20px 24px",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: "4px",
              fontSize: "18px",
            }}
          >
            Manage Catalog
          </h2>
          <p
            style={{
              color: "#64748b",
              marginTop: 0,
              marginBottom: "18px",
              fontSize: "13px",
            }}
          >
            Edit inventory details or move books to the 30-day archive vault.
          </p>

          {manageError && (
            <div
              style={{
                color: "#b91c1c",
                marginBottom: "15px",
                padding: "10px",
                backgroundColor: "#fef2f2",
                border: "1px solid #fca5a5",
                borderRadius: "4px",
                fontWeight: "bold",
              }}
            >
              {manageError}
            </div>
          )}
          {manageSuccess && (
            <div
              style={{
                color: "#15803d",
                marginBottom: "15px",
                padding: "10px",
                backgroundColor: "#f0fdf4",
                border: "1px solid #86efac",
                borderRadius: "4px",
                fontWeight: "bold",
              }}
            >
              {manageSuccess}
            </div>
          )}

          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              overflow: "hidden",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "14px",
                textAlign: "left",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#f1f5f9", color: "#475569" }}>
                  <th style={{ padding: "12px 16px" }}>System ID</th>
                  <th style={{ padding: "12px 16px" }}>Title & Author</th>
                  <th style={{ padding: "12px 16px" }}>ISBN</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loadingBooks ? (
                  <tr>
                    <td
                      colSpan={4}
                      style={{ padding: "20px", textAlign: "center" }}
                    >
                      Loading catalog...
                    </td>
                  </tr>
                ) : (
                  books.map((book) => (
                    <tr
                      key={book.book_id}
                      style={{ borderBottom: "1px solid #e2e8f0" }}
                    >
                      <td
                        style={{
                          padding: "12px 16px",
                          color: "#64748b",
                        }}
                      >
                        #{book.book_id}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <strong>{book.title}</strong>
                        <br />
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#64748b",
                          }}
                        >
                          by {book.author}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          fontFamily: "monospace",
                        }}
                      >
                        {book.isbn}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          textAlign: "right",
                        }}
                      >
                        <button
                          onClick={() => openEditModal(book)}
                          style={{
                            marginRight: "8px",
                            padding: "6px 12px",
                            backgroundColor: "#e2e8f0",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(book.book_id, book.title)
                          }
                          style={{
                            padding: "6px 12px",
                            backgroundColor: "#fee2e2",
                            color: "#dc2626",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontWeight: "bold",
                          }}
                        >
                          Archive
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ARCHIVE VAULT */}
        <section
          style={{
            flex: 1,
            minWidth: "320px",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            padding: "20px 24px",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: "4px",
              fontSize: "18px",
            }}
          >
            Archive Vault
          </h2>
          <p
            style={{
              color: "#64748b",
              marginTop: 0,
              marginBottom: "18px",
              fontSize: "13px",
            }}
          >
            Soft-deleted records pending a 30-day purge window. Restore to bring
            titles back into the active catalog.
          </p>

          {archiveError && (
            <div
              style={{
                color: "#b91c1c",
                marginBottom: "15px",
                padding: "10px",
                backgroundColor: "#fef2f2",
                border: "1px solid #fca5a5",
                borderRadius: "4px",
                fontWeight: "bold",
              }}
            >
              {archiveError}
            </div>
          )}
          {archiveSuccess && (
            <div
              style={{
                color: "#15803d",
                marginBottom: "15px",
                padding: "10px",
                backgroundColor: "#f0fdf4",
                border: "1px solid #86efac",
                borderRadius: "4px",
                fontWeight: "bold",
              }}
            >
              {archiveSuccess}
            </div>
          )}

          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              overflow: "hidden",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "14px",
                textAlign: "left",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#f1f5f9", color: "#475569" }}>
                  <th style={{ padding: "12px 16px" }}>Original ID</th>
                  <th style={{ padding: "12px 16px" }}>Archived Data</th>
                  <th style={{ padding: "12px 16px" }}>Archived On</th>
                  <th
                    style={{
                      padding: "12px 16px",
                      color: "#dc2626",
                    }}
                  >
                    Purge Date
                  </th>
                  <th
                    style={{
                      padding: "12px 16px",
                      textAlign: "center",
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loadingArchives ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{ padding: "20px", textAlign: "center" }}
                    >
                      Decrypting vault contents...
                    </td>
                  </tr>
                ) : archives.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: "20px",
                        textAlign: "center",
                        color: "#64748b",
                      }}
                    >
                      The vault is currently empty.
                    </td>
                  </tr>
                ) : (
                  archives.map((arc) => {
                    const payload =
                      typeof arc.record_payload === "string"
                        ? JSON.parse(arc.record_payload)
                        : arc.record_payload;

                    return (
                      <tr
                        key={arc.archive_id}
                        style={{ borderBottom: "1px solid #e2e8f0" }}
                      >
                        <td
                          style={{
                            padding: "12px 16px",
                            color: "#64748b",
                            fontWeight: "bold",
                          }}
                        >
                          #{arc.original_id}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <strong>{payload.title}</strong>
                          <br />
                          <span
                            style={{
                              fontSize: "12px",
                              color: "#64748b",
                              fontFamily: "monospace",
                            }}
                          >
                            ISBN: {payload.isbn}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          {arc.archived_date}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            color: "#dc2626",
                            fontWeight: "bold",
                          }}
                        >
                          {arc.deletion_date}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            textAlign: "center",
                          }}
                        >
                          <button
                            onClick={() => handleRestore(arc.archive_id)}
                            style={{
                              padding: "6px 12px",
                              backgroundColor: "#10b981",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontWeight: "bold",
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
        </section>
      </div>

      {/* EDIT MODAL */}
      {editingBook && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "8px",
              width: "400px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              Edit Book: {editingBook.book_id}
            </h3>
            <form
              onSubmit={handleUpdate}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "15px",
              }}
            >
              <div>
                <label>Title:</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm({ ...editForm, title: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    boxSizing: "border-box",
                  }}
                  required
                />
              </div>
              <div>
                <label>ISBN:</label>
                <input
                  type="text"
                  value={editForm.isbn}
                  onChange={(e) =>
                    setEditForm({ ...editForm, isbn: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    boxSizing: "border-box",
                  }}
                  required
                />
              </div>
              <div>
                <label>Synopsis:</label>
                <textarea
                  value={editForm.synopsis}
                  onChange={(e) =>
                    setEditForm({ ...editForm, synopsis: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    boxSizing: "border-box",
                    height: "80px",
                  }}
                  required
                />
              </div>
              <div>
                <label>Total Copies:</label>
                <input
                  type="number"
                  min={1}
                  value={editForm.totalCopies}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      totalCopies: Number(e.target.value),
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    boxSizing: "border-box",
                  }}
                  required
                />
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginTop: "10px",
                }}
              >
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: "10px",
                    backgroundColor: "#0f172a",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingBook(null)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    backgroundColor: "#e2e8f0",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
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