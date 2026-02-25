import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

export default function LibrarianLogin() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      // Path must match the router prefix (e.g., /api/members/login/librarian)
      const response = await api.post("/members/login/librarian", { 
          identifier: identifier, 
          password: password 
      });

      localStorage.setItem('adminToken', response.data.token);
      localStorage.setItem('role', 'librarian');
      localStorage.setItem('session_id', response.data.session_id);

      navigate("/admin/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid credentials. Check staff status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-50">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/85 px-5 py-6 shadow-[0_24px_80px_rgba(15,23,42,0.9)] backdrop-blur-2xl sm:px-7 sm:py-8">
        <div className="mb-6 text-center sm:mb-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 sm:text-xs">
            Staff access
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-slate-50 sm:text-2xl">
            Librarian Console Login
          </h1>
          <p className="mt-2 text-xs text-slate-400 sm:text-sm">
            Authenticate to manage circulation, catalog, and system health.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-rose-500/40 bg-rose-500/15 px-3 py-2 text-xs font-medium text-rose-100 shadow-inner shadow-rose-950/40 sm:mb-5 sm:px-4 sm:py-3 sm:text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-medium text-slate-200 sm:text-sm">
              Staff username or email
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              className="w-full rounded-2xl border border-slate-700/70 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 shadow-sm outline-none ring-0 placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/40"
              placeholder="you@cityarchive.local"
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-medium text-slate-200 sm:text-sm">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-2xl border border-slate-700/70 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 shadow-sm outline-none ring-0 placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/40"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/40 transition hover:bg-sky-400 hover:shadow-sky-400/50 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-600"
          >
            {loading ? "Authenticating..." : "Sign in as librarian"}
          </button>
        </form>

        <div className="mt-6 text-center text-[11px] text-slate-400 sm:mt-7 sm:text-xs">
          <Link
            to="/login"
            className="font-medium text-slate-300 underline-offset-4 hover:text-slate-50 hover:underline"
          >
            ← Back to member login
          </Link>
        </div>
      </div>
    </div>
  );
}