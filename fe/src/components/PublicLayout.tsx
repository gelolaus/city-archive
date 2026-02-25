import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function useIsMemberAuthenticated() {
  const [isAuthed, setIsAuthed] = useState<boolean>(() => {
    return Boolean(localStorage.getItem("token"));
  });

  useEffect(() => {
    const handler = () => {
      setIsAuthed(Boolean(localStorage.getItem("token")));
    };

    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return isAuthed;
}

export default function PublicLayout() {
  const isMemberAuthed = useIsMemberAuthenticated();
  const navigate = useNavigate();
  const location = useLocation();

  const isCatalog = location.pathname.startsWith("/catalog");
  const isDashboard = location.pathname.startsWith("/dashboard");

  return (
    <div className="relative min-h-screen overflow-hidden bg-amber-100 font-sans text-slate-900">
      {/* Warm acrylic background mesh inspired by DATAMA */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-[56rem] w-[56rem] -translate-x-1/2 rounded-full bg-amber-300/80 blur-3xl" />
        <div className="absolute -left-40 top-10 h-[48rem] w-[48rem] rounded-full bg-rose-300/75 blur-3xl" />
        <div className="absolute -right-40 top-32 h-[52rem] w-[52rem] rounded-full bg-orange-300/70 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 h-[52rem] w-[52rem] -translate-x-1/2 rounded-full bg-pink-300/70 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[40rem] w-[40rem] rounded-full bg-yellow-200/60 blur-3xl" />
      </div>

      <div className="relative flex min-h-screen flex-col px-4 pb-24 pt-6 sm:px-6 lg:px-8 sm:pb-28 lg:pb-32">
        {/* Navbar */}
        <header className="flex justify-center">
          <nav className="inline-flex w-full max-w-7xl items-center justify-between rounded-full border border-white/60 bg-white/70 px-4 py-2 shadow-2xl shadow-orange-200/60 ring-1 ring-white/50 backdrop-blur-2xl sm:px-6 sm:py-2.5">
            <button
              type="button"
              onClick={() => navigate("/catalog")}
              className="flex items-center gap-2 text-sm font-semibold tracking-tight text-slate-800 sm:text-base"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-amber-100 shadow-md">
                CA
              </span>
              <span className="hidden sm:inline">City Archive</span>
              <span className="hidden text-xs font-medium text-slate-500 sm:inline">
                Public Library Portal
              </span>
            </button>

            <div className="flex items-center gap-1.5 sm:gap-3">
              <button
                type="button"
                onClick={() => navigate("/catalog")}
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition duration-200 ease-out sm:px-4 sm:py-1.5 sm:text-sm ${
                  isCatalog
                    ? "bg-slate-900 text-amber-100 shadow-md"
                    : "text-slate-700 hover:bg-slate-900/5 hover:text-slate-900"
                }`}
              >
                Browse Catalog
              </button>

              {isMemberAuthed && (
                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className={`hidden items-center rounded-full px-3 py-1 text-xs font-medium transition duration-200 ease-out sm:inline-flex sm:px-4 sm:py-1.5 sm:text-sm ${
                    isDashboard
                      ? "bg-slate-900 text-amber-100 shadow-md"
                      : "text-slate-700 hover:bg-slate-900/5 hover:text-slate-900"
                  }`}
                >
                  Member Dashboard
                </button>
              )}

              {isMemberAuthed ? (
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem("token");
                    localStorage.removeItem("session_id");
                    navigate("/login");
                  }}
                  className="inline-flex items-center rounded-full border border-white/60 bg-white/70 px-3 py-1 text-xs font-medium text-slate-800 shadow-sm transition duration-200 ease-out hover:bg-white/90 hover:shadow-md sm:px-4 sm:py-1.5 sm:text-sm"
                >
                  Logout
                </button>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center rounded-full border border-slate-900/10 bg-slate-900 px-3 py-1 text-xs font-medium text-amber-50 shadow-md transition duration-150 ease-out hover:bg-slate-800 hover:shadow-lg sm:px-4 sm:py-1.5 sm:text-sm"
                >
                  Member Login
                </Link>
              )}
            </div>
          </nav>
        </header>

        {/* Page content */}
        <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col py-8 sm:py-10">
          <Outlet />
        </main>

        {/* Footer */}
        <div className="pointer-events-none fixed inset-x-0 bottom-4 px-4 sm:px-6 lg:px-8">
          <footer className="pointer-events-auto mx-auto flex w-full max-w-7xl items-center justify-between rounded-full border border-white/60 bg-white/70 px-4 py-2 text-xs text-slate-600 shadow-2xl shadow-orange-200/60 ring-1 ring-white/50 backdrop-blur-2xl sm:px-6 sm:text-sm">
            <span className="truncate">
              City Archive · Member & Public Portal
            </span>
            <span className="hidden items-center gap-2 text-[11px] text-slate-500 sm:flex">
              <span className="h-1 w-1 rounded-full bg-emerald-400" />
              Live with JhunDB backend
            </span>
          </footer>
        </div>
      </div>
    </div>
  );
}

