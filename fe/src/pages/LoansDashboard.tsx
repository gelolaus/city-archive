import { useEffect, useMemo, useState, type FormEvent } from "react";
import api from "../api/axios";

interface ActiveLoan {
  loan_id: number;
  member_name: string;
  title: string;
  due_date: string; // YYYY-MM-DD
}

export default function LoansDashboard() {
  const [activeLoans, setActiveLoans] = useState<ActiveLoan[]>([]);
  const [loadingActive, setLoadingActive] = useState(true);
  const [activeError, setActiveError] = useState("");

  const [globalError, setGlobalError] = useState("");
  const [globalSuccess, setGlobalSuccess] = useState("");

  // --- ISSUE LOAN STATE (borrow) ---
  const [borrowLoading, setBorrowLoading] = useState(false);
  const [memberQuery, setMemberQuery] = useState("");
  const [memberResults, setMemberResults] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  const [bookQuery, setBookQuery] = useState("");
  const [bookResults, setBookResults] = useState<any[]>([]);
  const [selectedBook, setSelectedBook] = useState<any>(null);

  // --- QUICK RETURN STATE ---
  const [returnSearch, setReturnSearch] = useState("");
  const [processingLoanId, setProcessingLoanId] = useState<number | null>(null);

  // Safely extract the Librarian ID from the JWT token
  const getLibrarianId = () => {
    const token = localStorage.getItem("adminToken");
    if (!token) return 1;
    try {
      return JSON.parse(atob(token.split(".")[1])).id;
    } catch {
      return 1;
    }
  };

  const fetchActiveLoans = async () => {
    try {
      setLoadingActive(true);
      setActiveError("");
      const res = await api.get("/books/loans/active/all", {
        headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
      });
      setActiveLoans(res.data.data || []);
    } catch {
      setActiveError("Failed to load active loans ledger.");
    } finally {
      setLoadingActive(false);
    }
  };

  useEffect(() => {
    fetchActiveLoans();
  }, []);

  // --- Member search for issuing loans ---
  useEffect(() => {
    if (memberQuery.length > 1 && !selectedMember) {
      api
        .get(`/members/search?keyword=${memberQuery}`)
        .then((res) => setMemberResults(res.data.data))
        .catch(() => {});
    } else {
      setMemberResults([]);
    }
  }, [memberQuery, selectedMember]);

  // --- Book search for issuing loans ---
  useEffect(() => {
    if (bookQuery.length > 1 && !selectedBook) {
      api
        .get(`/books/search?keyword=${bookQuery}&status=available`)
        .then((res) => setBookResults(res.data.data))
        .catch(() => {});
    } else {
      setBookResults([]);
    }
  }, [bookQuery, selectedBook]);

  const handleBorrow = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !selectedBook) {
      setGlobalError("Please select both a valid member and an available book.");
      return;
    }

    setBorrowLoading(true);
    setGlobalError("");
    setGlobalSuccess("");

    try {
      await api.post(
        "/books/borrow",
        {
          memberId: selectedMember.member_id,
          bookId: selectedBook.book_id,
          librarianId: getLibrarianId(),
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
        }
      );

      setGlobalSuccess(
        `Success! "${selectedBook.title}" has been issued to ${selectedMember.full_name}.`
      );

      setSelectedMember(null);
      setMemberQuery("");
      setSelectedBook(null);
      setBookQuery("");

      fetchActiveLoans();
    } catch (err: any) {
      setGlobalError(
        err?.response?.data?.database_error ||
          err?.response?.data?.message ||
          "Failed to process loan."
      );
    } finally {
      setBorrowLoading(false);
    }
  };

  const handleReturn = async (loanId: number, bookTitle: string) => {
    setProcessingLoanId(loanId);
    setGlobalError("");
    setGlobalSuccess("");

    try {
      await api.post(
        `/books/return/${loanId}`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
        }
      );

      setGlobalSuccess(`Success! "${bookTitle}" has been returned to the catalog.`);

      // Optimistically remove from current ledger
      setActiveLoans((prev) => prev.filter((loan) => loan.loan_id !== loanId));
    } catch (err: any) {
      setGlobalError(
        err?.response?.data?.database_error ||
          err?.response?.data?.message ||
          "Failed to process return."
      );
    } finally {
      setProcessingLoanId(null);
    }
  };

  const isOverdue = (dueDate: string) => {
    if (!dueDate) return false;
    const today = new Date();
    const due = new Date(dueDate + "T23:59:59");
    return due.getTime() < today.getTime();
  };

  const filteredLoans = useMemo(() => {
    if (!returnSearch.trim()) return activeLoans;
    const query = returnSearch.toLowerCase();
    return activeLoans.filter((loan) => {
      return (
        loan.title.toLowerCase().includes(query) ||
        loan.member_name.toLowerCase().includes(query) ||
        loan.loan_id.toString().includes(query)
      );
    });
  }, [returnSearch, activeLoans]);

  return (
    <div className="space-y-5 text-slate-900">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Loans & Circulation
        </h2>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">
          Unified view for issuing, tracking, and closing all active loans.
        </p>
      </div>

      {globalError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700 shadow-sm sm:text-sm">
          {globalError}
        </div>
      )}

      {globalSuccess && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700 shadow-sm sm:text-sm">
          {globalSuccess}
        </div>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
        {/* MIDDLE COLUMN: ACTIVE LEDGER */}
        <div style={{ flex: 1.6, minWidth: 0 }}>
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "15px 20px",
                borderBottom: "1px solid #e2e8f0",
                backgroundColor: "#f8fafc",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "16px",
                  color: "#0f172a",
                }}
              >
                Active Loans Ledger
              </h3>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: "12px",
                  color: "#64748b",
                }}
              >
                Live list of all items currently checked out across members.
              </p>
            </div>

            {activeError && (
              <div
                style={{
                  padding: "10px 20px",
                  color: "#b91c1c",
                  backgroundColor: "#fef2f2",
                  borderBottom: "1px solid #fecaca",
                  fontSize: "13px",
                }}
              >
                {activeError}
              </div>
            )}

            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "14px",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#f1f5f9", color: "#475569" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left" }}>
                    Member
                  </th>
                  <th style={{ padding: "12px 16px", textAlign: "left" }}>
                    Book
                  </th>
                  <th style={{ padding: "12px 16px", textAlign: "left" }}>
                    Due Date
                  </th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>
                    Quick Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {loadingActive ? (
                  <tr>
                    <td
                      colSpan={4}
                      style={{
                        padding: "20px",
                        textAlign: "center",
                        color: "#64748b",
                      }}
                    >
                      Loading active loans...
                    </td>
                  </tr>
                ) : activeLoans.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      style={{
                        padding: "20px",
                        textAlign: "center",
                        color: "#64748b",
                      }}
                    >
                      No active loans in the system.
                    </td>
                  </tr>
                ) : (
                  activeLoans.map((loan) => {
                    const overdue = isOverdue(loan.due_date);
                    return (
                      <tr
                        key={loan.loan_id}
                        style={{
                          borderBottom: "1px solid #e2e8f0",
                          backgroundColor: overdue ? "#fef2f2" : "white",
                        }}
                      >
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ fontWeight: "bold" }}>
                            {loan.member_name}
                          </span>
                          <br />
                          <small style={{ color: "#64748b" }}>
                            Loan #{loan.loan_id}
                          </small>
                        </td>
                        <td style={{ padding: "12px 16px" }}>{loan.title}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span
                            style={{
                              fontWeight: overdue ? "bold" : 500,
                              color: overdue ? "#dc2626" : "#0f172a",
                            }}
                          >
                            {loan.due_date}
                          </span>
                          {overdue && (
                            <span
                              style={{
                                marginLeft: "6px",
                                fontSize: "12px",
                                color: "#dc2626",
                              }}
                            >
                              OVERDUE
                            </span>
                          )}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            textAlign: "right",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => handleReturn(loan.loan_id, loan.title)}
                            disabled={processingLoanId === loan.loan_id}
                            style={{
                              padding: "8px 14px",
                              backgroundColor: "#0ea5e9",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor:
                                processingLoanId === loan.loan_id
                                  ? "not-allowed"
                                  : "pointer",
                              fontWeight: 600,
                              fontSize: "13px",
                            }}
                          >
                            {processingLoanId === loan.loan_id
                              ? "Returning..."
                              : "Return Now"}
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

        {/* RIGHT COLUMN: ISSUE + RETURN PANELS */}
        <div style={{ flex: 1.4, display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Issue Loan */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              padding: "20px",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "4px", fontSize: "16px" }}>
              Issue a Loan
            </h3>
            <p
              style={{
                margin: 0,
                marginBottom: "16px",
                fontSize: "12px",
                color: "#64748b",
              }}
            >
              Search a member and an available title to create a new checkout.
            </p>

            <form
              onSubmit={handleBorrow}
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {/* Member */}
              <div style={{ position: "relative" }}>
                <label
                  style={{
                    fontWeight: "bold",
                    fontSize: "13px",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  1. Member
                </label>
                {selectedMember ? (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px",
                      backgroundColor: "#f1f5f9",
                      border: "1px solid #cbd5e1",
                      borderRadius: "4px",
                    }}
                  >
                    <span>
                      <strong>{selectedMember.full_name}</strong> (ID:{" "}
                      {selectedMember.member_id})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMember(null);
                        setMemberQuery("");
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#dc2626",
                        cursor: "pointer",
                        fontWeight: "bold",
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Search by name, email, or username..."
                      value={memberQuery}
                      onChange={(e) => setMemberQuery(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "9px",
                        borderRadius: "4px",
                        border: "1px solid #cbd5e1",
                        fontSize: "13px",
                      }}
                    />
                    {memberResults.length > 0 && (
                      <ul
                        style={{
                          position: "absolute",
                          width: "100%",
                          backgroundColor: "white",
                          border: "1px solid #cbd5e1",
                          borderTop: "none",
                          listStyle: "none",
                          padding: 0,
                          margin: 0,
                          maxHeight: "200px",
                          overflowY: "auto",
                          zIndex: 10,
                        }}
                      >
                        {memberResults.map((m) => (
                          <li
                            key={m.member_id}
                            onClick={() => {
                              setSelectedMember(m);
                              setMemberResults([]);
                            }}
                            style={{
                              padding: "8px 10px",
                              borderBottom: "1px solid #e5e7eb",
                              cursor: "pointer",
                              fontSize: "13px",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.backgroundColor = "#f8fafc")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.backgroundColor = "white")
                            }
                          >
                            <strong>{m.full_name}</strong>{" "}
                            <span style={{ color: "#64748b", fontSize: "11px" }}>
                              - ID: {m.member_id} ({m.email})
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </div>

              {/* Book */}
              <div style={{ position: "relative" }}>
                <label
                  style={{
                    fontWeight: "bold",
                    fontSize: "13px",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  2. Available Book
                </label>
                {selectedBook ? (
                  <div
                    style={{
                      padding: "10px",
                      backgroundColor: "#f0fdf4",
                      border: "1px solid #86efac",
                      borderRadius: "4px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "6px",
                      }}
                    >
                      <span>
                        <strong>{selectedBook.title}</strong> by {selectedBook.author}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBook(null);
                          setBookQuery("");
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#dc2626",
                          cursor: "pointer",
                          fontWeight: "bold",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#475569",
                        borderTop: "1px dashed #bbf7d0",
                        paddingTop: "6px",
                      }}
                    >
                      <p style={{ margin: "0 0 3px 0" }}>
                        <strong>Synopsis:</strong>{" "}
                        {selectedBook.synopsis?.substring(0, 80)}...
                      </p>
                      <p style={{ margin: 0 }}>
                        <strong>System ID:</strong> {selectedBook.book_id}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Search title, author, or ISBN (available only)..."
                      value={bookQuery}
                      onChange={(e) => setBookQuery(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "9px",
                        borderRadius: "4px",
                        border: "1px solid #cbd5e1",
                        fontSize: "13px",
                      }}
                    />
                    {bookResults.length > 0 && (
                      <ul
                        style={{
                          position: "absolute",
                          width: "100%",
                          backgroundColor: "white",
                          border: "1px solid #cbd5e1",
                          borderTop: "none",
                          listStyle: "none",
                          padding: 0,
                          margin: 0,
                          maxHeight: "200px",
                          overflowY: "auto",
                          zIndex: 10,
                        }}
                      >
                        {bookResults.map((b) => (
                          <li
                            key={b.book_id}
                            onClick={() => {
                              setSelectedBook(b);
                              setBookResults([]);
                            }}
                            style={{
                              padding: "8px 10px",
                              borderBottom: "1px solid #e5e7eb",
                              cursor: "pointer",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              fontSize: "13px",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.backgroundColor = "#f8fafc")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.backgroundColor = "white")
                            }
                          >
                            <span>
                              <strong>{b.title}</strong> by {b.author}
                            </span>
                            <span
                              style={{ color: "#64748b", fontSize: "11px", marginLeft: 8 }}
                            >
                              ID: {b.book_id}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </div>

              <button
                type="submit"
                disabled={
                  borrowLoading || !selectedMember || !selectedBook
                }
                style={{
                  padding: "10px 14px",
                  backgroundColor:
                    !selectedMember || !selectedBook ? "#94a3b8" : "#0f172a",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor:
                    !selectedMember || !selectedBook
                      ? "not-allowed"
                      : "pointer",
                  fontWeight: "bold",
                  fontSize: "14px",
                  marginTop: "4px",
                }}
              >
                {borrowLoading ? "Issuing Loan..." : "Issue Loan"}
              </button>
            </form>
          </div>

          {/* Process Return */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              padding: "20px",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "4px", fontSize: "16px" }}>
              Process Return
            </h3>
            <p
              style={{
                margin: 0,
                marginBottom: "12px",
                fontSize: "12px",
                color: "#64748b",
              }}
            >
              Search by Loan ID, member, or book title to mark items as returned.
            </p>

            <input
              type="text"
              placeholder="Type Loan ID, member, or book title..."
              value={returnSearch}
              onChange={(e) => setReturnSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "9px",
                borderRadius: "4px",
                border: "1px solid #cbd5e1",
                fontSize: "13px",
                marginBottom: "10px",
              }}
            />

            <div
              style={{
                maxHeight: "230px",
                overflowY: "auto",
                borderRadius: "6px",
                border: "1px solid #e5e7eb",
              }}
            >
              {filteredLoans.length === 0 ? (
                <div
                  style={{
                    padding: "14px",
                    textAlign: "center",
                    fontSize: "13px",
                    color: "#64748b",
                  }}
                >
                  {activeLoans.length === 0
                    ? "No active loans to process."
                    : "No loans match your search."}
                </div>
              ) : (
                filteredLoans.map((loan) => {
                  const overdue = isOverdue(loan.due_date);
                  return (
                    <div
                      key={loan.loan_id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 12px",
                        borderBottom: "1px solid #e5e7eb",
                        backgroundColor: overdue ? "#fef2f2" : "white",
                      }}
                    >
                      <div style={{ marginRight: "8px" }}>
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#0f172a",
                          }}
                        >
                          {loan.title}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#64748b",
                          }}
                        >
                          {loan.member_name} • Loan #{loan.loan_id}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            marginTop: "2px",
                            color: overdue ? "#dc2626" : "#64748b",
                          }}
                        >
                          Due {loan.due_date}
                          {overdue && " • OVERDUE"}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleReturn(loan.loan_id, loan.title)}
                        disabled={processingLoanId === loan.loan_id}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#0ea5e9",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor:
                            processingLoanId === loan.loan_id
                              ? "not-allowed"
                              : "pointer",
                          fontWeight: 600,
                          fontSize: "12px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {processingLoanId === loan.loan_id
                          ? "Returning..."
                          : "Return"}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

