import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";

export default function Catalog() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [keyword, setKeyword] = useState(searchParams.get("keyword") || "");
  const [searchType, setSearchType] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");

  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchBooks = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/books/search", {
        params: {
          keyword,
          type: searchType,
          status: availabilityFilter,
        },
      });
      setBooks(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch the catalog.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchBooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setSearchParams(keyword ? { keyword } : {});
    void fetchBooks();
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Hero search shell */}
      <section className="space-y-4 rounded-3xl border border-white/60 bg-white/75 p-5 shadow-2xl shadow-orange-200/60 ring-1 ring-white/60 backdrop-blur-2xl sm:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Public catalog
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Search the City Archive
            </h1>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Discover titles by keyword, author, or category. Results are always
              live from the same backend powering member dashboards.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSearch}
          className="mt-3 space-y-3 sm:mt-4 sm:space-y-4"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <div className="flex flex-1 items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1.5 text-sm shadow-lg shadow-slate-200/60 backdrop-blur-xl focus-within:border-sky-300 focus-within:ring-2 focus-within:ring-sky-200/80">
              <div className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-slate-900/90 text-[11px] text-amber-100">
                🔎
              </div>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Search books, authors, or ISBNs..."
                className="h-8 flex-1 border-none bg-transparent text-xs text-slate-900 placeholder:text-slate-400 outline-none sm:text-sm"
              />
            </div>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-amber-50 shadow-lg shadow-slate-900/25 transition hover:bg-slate-800 hover:shadow-xl active:scale-[0.99] sm:w-auto sm:text-sm"
            >
              {loading ? "Searching..." : "Search catalog"}
            </button>
          </div>

          <div className="flex flex-col gap-2 text-[11px] text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:text-xs">
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-600 sm:text-xs">
                  Search in
                </span>
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="h-7 rounded-full border border-slate-200/80 bg-white/80 px-2 text-[11px] text-slate-700 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-200/80 sm:text-xs"
                >
                  <option value="all">Anywhere</option>
                  <option value="title">Title only</option>
                  <option value="author">Author only</option>
                </select>
              </div>

              <div className="flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-600 sm:text-xs">
                  Availability
                </span>
                <select
                  value={availabilityFilter}
                  onChange={(e) => setAvailabilityFilter(e.target.value)}
                  className="h-7 rounded-full border border-slate-200/80 bg-white/80 px-2 text-[11px] text-slate-700 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-200/80 sm:text-xs"
                >
                  <option value="all">All books</option>
                  <option value="available">Available now</option>
                  <option value="borrowed">Currently borrowed</option>
                </select>
              </div>
            </div>
          </div>
        </form>
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-xs font-medium text-rose-700 shadow-sm sm:text-sm">
          {error}
        </div>
      )}

      {/* Results grid */}
      <section className="rounded-3xl border border-white/60 bg-white/80 p-4 shadow-xl shadow-slate-200/70 backdrop-blur-xl sm:p-5">
        {books.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-10 text-center text-sm text-slate-500 sm:px-8 sm:text-base">
            <h2 className="text-lg font-semibold text-slate-800 sm:text-xl">
              No books found
            </h2>
            <p className="mt-1 max-w-md text-xs text-slate-500 sm:text-sm">
              Try broadening your search, or clear one of the filters above to
              explore more of the collection.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {books.map((book) => (
              <button
                key={book.book_id}
                type="button"
                onClick={() => navigate(`/book/${book.book_id}`)}
                className="flex flex-col rounded-2xl border border-slate-200/80 bg-white/90 p-4 text-left text-sm text-slate-900 shadow-sm shadow-slate-200/70 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <h3 className="line-clamp-2 text-sm font-semibold text-slate-900 sm:text-[15px]">
                    {book.title}
                  </h3>
                  {book.available ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                      Available
                    </span>
                  ) : (
                    <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                      Borrowed
                    </span>
                  )}
                </div>

                <div className="mb-3 space-y-1 text-[11px] text-slate-600 sm:text-xs">
                  <p>
                    <span className="font-semibold text-slate-700">Author:</span>{" "}
                    {book.author}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700">
                      Category:
                    </span>{" "}
                    {book.category}
                  </p>
                </div>

                <div className="mt-auto flex items-center justify-between text-[11px] text-slate-500 sm:text-xs">
                  <span className="font-medium text-slate-600">
                    View details
                  </span>
                  <span>→</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
