import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

export default function Login() {
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
      const response = await api.post("/members/login", {
        identifier,
        password,
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("session_id", response.data.session_id);

      navigate("/dashboard");
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        "Invalid credentials. Check your backend server.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-white/60 bg-white/70 p-6 shadow-2xl shadow-orange-200/70 ring-1 ring-white/60 backdrop-blur-2xl sm:p-8">
        <div className="mb-6 text-center sm:mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Member Access
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Sign in to City Archive
          </h1>
          <p className="mt-2 text-xs text-slate-500 sm:text-sm">
            Borrow books, track loans, and view your reading history.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50/80 px-3 py-2 text-xs font-medium text-rose-700 shadow-sm sm:mb-5 sm:px-4 sm:py-3 sm:text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-medium text-slate-700 sm:text-sm">
              Username or Email
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              className="w-full rounded-2xl border border-slate-200/70 bg-white/70 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-sky-300 focus:ring-2 focus:ring-sky-200/80"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-medium text-slate-700 sm:text-sm">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-2xl border border-slate-200/70 bg-white/70 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-sky-300 focus:ring-2 focus:ring-sky-200/80"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-2.5 text-sm font-medium text-amber-50 shadow-lg shadow-slate-900/20 transition duration-150 ease-out hover:bg-slate-800 hover:shadow-xl active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-500"
          >
            {loading ? "Authenticating..." : "Sign in"}
          </button>
        </form>

        <div className="mt-6 space-y-2 text-center text-xs text-slate-600 sm:mt-7 sm:text-sm">
          <p>
            New here?{" "}
            <Link
              to="/register"
              className="font-semibold text-slate-900 underline-offset-4 hover:underline"
            >
              Create a member account
            </Link>
          </p>
          <p className="text-[11px] text-slate-500 sm:text-xs">
            Library staff?{" "}
            <Link
              to="/admin/login"
              className="font-semibold text-slate-700 underline-offset-4 hover:text-slate-900 hover:underline"
            >
              Go to Librarian login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
