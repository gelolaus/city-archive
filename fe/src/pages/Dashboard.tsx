import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [historyFilter, setHistoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const [dashboardData, setDashboardData] = useState({
    totalFinesPaid: 0,
    overdueBooks: [] as any[],
    currentLoans: [] as any[],
    history: [] as any[],
  });

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/members/dashboard?filter=${historyFilter}`);
      setDashboardData(response.data.data);
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      }
      console.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDashboardData();
  }, [historyFilter]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("session_id");
    navigate("/login");
  };

  const handleQuickSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?keyword=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate(`/catalog`);
    }
  };

  if (
    loading &&
    dashboardData.currentLoans.length === 0 &&
    dashboardData.history.length === 0
  ) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-slate-700 sm:text-base">
        Loading your member command center...
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Top header + quick search card */}
      <section className="space-y-4 rounded-3xl border border-white/60 bg-white/70 p-5 shadow-xl shadow-orange-200/60 ring-1 ring-white/60 backdrop-blur-2xl sm:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Member dashboard
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Welcome back to City Archive
            </h1>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Track what&apos;s overdue, what&apos;s on loan, and your full reading
              history in one glance.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center justify-center rounded-full border border-rose-100 bg-rose-500 px-3 py-1.5 text-xs font-semibold text-rose-50 shadow-md shadow-rose-200/70 transition hover:bg-rose-600 sm:px-4 sm:text-sm"
          >
            Sign out
          </button>
        </div>

        <form
          onSubmit={handleQuickSearch}
          className="mt-3 flex flex-col gap-2 sm:mt-4 sm:flex-row sm:items-center sm:gap-3"
        >
          <div className="flex flex-1 items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1.5 text-sm shadow-lg shadow-slate-200/60 backdrop-blur-xl focus-within:border-sky-300 focus-within:ring-2 focus-within:ring-sky-200/80">
            <div className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-slate-900/90 text-[11px] text-amber-100">
              🔍
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search the public catalog by title, author, or keyword..."
              className="h-8 flex-1 border-none bg-transparent text-xs text-slate-900 placeholder:text-slate-400 outline-none sm:text-sm"
            />
          </div>

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-amber-50 shadow-lg shadow-slate-900/25 transition hover:bg-slate-800 hover:shadow-xl active:scale-[0.99] sm:w-auto sm:text-sm"
          >
            Find books
          </button>
        </form>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {/* Main column */}
        <div className="space-y-5">
          {/* Overdue books */}
          <section className="rounded-3xl border border-rose-200/70 bg-rose-50/80 p-4 shadow-md shadow-rose-100/70 backdrop-blur-xl sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-rose-900 sm:text-base">
                <span>⚠️ Critical: Overdue books</span>
                {dashboardData.overdueBooks?.length > 0 && (
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                    {dashboardData.overdueBooks.length}
                  </span>
                )}
              </h2>
              <p className="hidden text-[11px] text-rose-700 sm:block">
                Return these first to minimize fines.
              </p>
            </div>

            <div className="mt-3 space-y-2 text-xs sm:mt-4 sm:text-sm">
              {!dashboardData.overdueBooks ||
              dashboardData.overdueBooks.length === 0 ? (
                <p className="rounded-2xl border border-rose-100 bg-rose-50/80 px-3 py-2 text-rose-800">
                  You have no overdue books. Great job staying on track.
                </p>
              ) : (
                dashboardData.overdueBooks.map((book: any) => (
                  <div
                    key={book.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-rose-100 bg-white/80 px-3 py-2 shadow-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {book.title}
                      </p>
                      <p className="text-[11px] text-rose-700 sm:text-xs">
                        Due {book.dueDate}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-rose-700 sm:text-sm">
                        ₱{parseFloat(book.fine).toFixed(2)}
                      </p>
                      <p className="text-[11px] text-rose-500">Estimated fine</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Current loans */}
          <section className="rounded-3xl border border-white/60 bg-white/80 p-4 shadow-md shadow-slate-200/70 backdrop-blur-xl sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 sm:text-base">
                Currently checked out
              </h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 sm:text-xs">
                {dashboardData.currentLoans?.length || 0} active
              </span>
            </div>

            <div className="mt-3 space-y-2 text-xs sm:mt-4 sm:text-sm">
              {!dashboardData.currentLoans ||
              dashboardData.currentLoans.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-3 py-2 text-slate-500">
                  You don&apos;t have any active loans. Use the search above to find
                  something to borrow.
                </p>
              ) : (
                dashboardData.currentLoans.map((book: any) => (
                  <div
                    key={book.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white/90 px-3 py-2 shadow-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {book.title}
                      </p>
                      <p className="text-[11px] text-slate-500 sm:text-xs">
                        Due {book.dueDate}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold sm:text-xs ${
                        book.status === "Overdue"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {book.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* History */}
          <section className="rounded-3xl border border-white/60 bg-white/80 p-4 shadow-md shadow-slate-200/70 backdrop-blur-xl sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 sm:text-base">
                  Borrowing history
                </h2>
                <p className="text-[11px] text-slate-500 sm:text-xs">
                  Filter your reading timeline by recent months or full history.
                </p>
              </div>
              <select
                value={historyFilter}
                onChange={(e) => setHistoryFilter(e.target.value)}
                className="h-9 rounded-full border border-slate-200/80 bg-white/80 px-3 text-xs text-slate-700 shadow-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-200/80 sm:text-sm"
              >
                <option value="all">All time</option>
                <option value="1m">Last month</option>
                <option value="3m">Last 3 months</option>
                <option value="9m">Last 9 months</option>
                <option value="1y">Last year</option>
              </select>
            </div>

            <div className="mt-3 space-y-1.5 text-xs sm:mt-4 sm:text-sm">
              {!dashboardData.history || dashboardData.history.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-3 py-2 text-slate-500">
                  No history found for this period.
                </p>
              ) : (
                dashboardData.history.map((book: any) => (
                  <div
                    key={book.id}
                    className="flex items-center justify-between gap-3 rounded-2xl px-3 py-1.5 text-sm text-slate-800 hover:bg-slate-50/80"
                  >
                    <span className="truncate">{book.title}</span>
                    <span className="text-[11px] text-slate-500 sm:text-xs">
                      Returned {book.returnedOn}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Side column */}
        <aside className="space-y-4">
          <section className="rounded-3xl border border-white/60 bg-white/80 p-4 text-center shadow-md shadow-slate-200/70 backdrop-blur-xl sm:p-5">
            <h2 className="text-sm font-semibold text-slate-800 sm:text-base">
              Total fines paid
            </h2>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              ₱{(dashboardData.totalFinesPaid || 0).toFixed(2)}
            </p>
            <p className="mt-1 text-[11px] text-slate-500 sm:text-xs">
              Lifetime of this account
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
