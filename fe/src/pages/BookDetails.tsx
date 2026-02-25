import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function BookDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const response = await api.get(`/books/${id}`);
        setBook(response.data.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Could not load book details.");
      } finally {
        setLoading(false);
      }
    };

    void fetchBook();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-slate-700 sm:text-base">
        Loading book data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center text-center text-sm text-rose-600 sm:text-base">
        {error}
      </div>
    );
  }

  if (!book) return null;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 py-4 sm:py-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex w-max items-center gap-1 rounded-full border border-white/60 bg-white/70 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm shadow-slate-200/80 backdrop-blur-xl transition hover:bg-white hover:text-slate-900 sm:px-4 sm:text-sm"
      >
        <span>←</span>
        <span>Back to catalog</span>
      </button>

      <section className="mt-1 grid gap-6 rounded-3xl border border-white/60 bg-white/80 p-4 shadow-2xl shadow-slate-200/70 backdrop-blur-2xl sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.5fr)] sm:p-6 lg:gap-8">
        {/* Cover + availability */}
        <div className="space-y-4">
          {book.cover_image && (
            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-100/70 shadow-md shadow-slate-200/80">
              <img
                src={book.cover_image}
                alt={book.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div className="text-center">
            {book.available ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 px-3 py-2 text-xs font-semibold text-emerald-800 shadow-sm sm:text-sm">
                🟢 Available{" "}
                {book.inventory && (
                  <span className="font-normal text-emerald-700">
                    ({book.inventory.available_copies} of{" "}
                    {book.inventory.total_copies} copies)
                  </span>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-rose-200 bg-rose-50/90 px-3 py-2 text-xs font-semibold text-rose-800 shadow-sm sm:text-sm">
                🔴 Currently checked out
              </div>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <span className="inline-flex rounded-full bg-slate-900/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-100 shadow-sm sm:text-xs">
              {book.category || "Uncategorized"}
            </span>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
              {book.title}
            </h1>
            <p className="text-sm text-slate-600 sm:text-base">
              by{" "}
              <span className="font-semibold text-slate-800">{book.author}</span>
            </p>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 text-xs text-slate-700 shadow-inner sm:p-5 sm:text-sm">
            <h2 className="text-sm font-semibold text-slate-900 sm:text-base">
              Synopsis
            </h2>
            <p className="leading-relaxed text-slate-700">{book.synopsis}</p>
          </div>

          <div className="grid gap-3 text-xs text-slate-700 sm:grid-cols-2 sm:text-sm">
            <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-3 shadow-sm sm:p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 sm:text-xs">
                ISBN
              </p>
              <p className="mt-1 font-mono text-sm text-slate-900 sm:text-base">
                {book.isbn}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-3 shadow-sm sm:p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 sm:text-xs">
                System ID
              </p>
              <p className="mt-1 font-mono text-sm text-slate-900 sm:text-base">
                {book.book_id}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
