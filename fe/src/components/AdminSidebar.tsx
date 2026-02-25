import { NavLink, useNavigate } from "react-router-dom";

export default function AdminSidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("role");
    navigate("/admin/login");
  };

  return (
    <aside className="relative z-20 flex w-64 flex-col gap-6 border-r border-white/60 bg-white/80 px-4 py-5 text-slate-900 shadow-2xl shadow-orange-200/60 backdrop-blur-2xl lg:w-72 lg:px-6">
      <div>
        <h2 className="text-base font-semibold tracking-tight text-slate-900 lg:text-lg">
          Staff Panel
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Library operations & governance
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-5 text-sm">
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Overview
          </p>
          <div className="space-y-1">
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) =>
                [
                  "flex items-center gap-2 rounded-2xl px-2.5 py-2 text-xs font-medium transition",
                  isActive
                    ? "bg-slate-900 text-amber-50 shadow-md"
                    : "text-slate-700 hover:bg-slate-900/5 hover:text-slate-900",
                ].join(" ")
              }
            >
              <span className="text-base">📊</span>
              <span>Stats overview</span>
            </NavLink>
          </div>
        </div>

        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Circulation
          </p>
          <div className="space-y-1">
            <NavLink
              to="/admin/loans"
              className={({ isActive }) =>
                [
                  "flex items-center gap-2 rounded-2xl px-2.5 py-2 text-xs font-medium transition",
                  isActive
                    ? "bg-slate-900 text-amber-50 shadow-md"
                    : "text-slate-700 hover:bg-slate-900/5 hover:text-slate-900",
                ].join(" ")
              }
            >
              <span className="text-base">🤝</span>
              <span>Loans dashboard</span>
            </NavLink>
            <NavLink
              to="/admin/fines"
              className={({ isActive }) =>
                [
                  "flex items-center gap-2 rounded-2xl px-2.5 py-2 text-xs font-medium transition",
                  isActive
                    ? "bg-slate-900 text-amber-50 shadow-md"
                    : "text-slate-700 hover:bg-slate-900/5 hover:text-slate-900",
                ].join(" ")
              }
            >
              <span className="text-base">💳</span>
              <span>Settle fines</span>
            </NavLink>
          </div>
        </div>

        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Management
          </p>
          <div className="space-y-1">
            <NavLink
              to="/admin/books"
              className={({ isActive }) =>
                [
                  "flex items-center gap-2 rounded-2xl px-2.5 py-2 text-xs font-medium transition",
                  isActive
                    ? "bg-slate-900 text-amber-50 shadow-md"
                    : "text-slate-700 hover:bg-slate-900/5 hover:text-slate-900",
                ].join(" ")
              }
            >
              <span className="text-base">📖</span>
              <span>Manage books</span>
            </NavLink>
            <NavLink
              to="/admin/authors"
              className={({ isActive }) =>
                [
                  "flex items-center gap-2 rounded-2xl px-2.5 py-2 text-xs font-medium transition",
                  isActive
                    ? "bg-slate-900 text-amber-50 shadow-md"
                    : "text-slate-700 hover:bg-slate-900/5 hover:text-slate-900",
                ].join(" ")
              }
            >
              <span className="text-base">✍️</span>
              <span>Manage authors</span>
            </NavLink>
            <NavLink
              to="/admin/members"
              className={({ isActive }) =>
                [
                  "flex items-center gap-2 rounded-2xl px-2.5 py-2 text-xs font-medium transition",
                  isActive
                    ? "bg-slate-900 text-amber-50 shadow-md"
                    : "text-slate-700 hover:bg-slate-900/5 hover:text-slate-900",
                ].join(" ")
              }
            >
              <span className="text-base">👤</span>
              <span>Manage members</span>
            </NavLink>
          </div>
        </div>

        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            System
          </p>
          <div className="space-y-1">
            <NavLink
              to="/admin/audit-logs"
              className={({ isActive }) =>
                [
                  "flex items-center gap-2 rounded-2xl px-2.5 py-2 text-xs font-medium transition",
                  isActive
                    ? "bg-slate-900 text-amber-50 shadow-md"
                    : "text-slate-700 hover:bg-slate-900/5 hover:text-slate-900",
                ].join(" ")
              }
            >
              <span className="text-base">📋</span>
              <span>Audit trails</span>
            </NavLink>
            <NavLink
              to="/admin/diagnostics"
              className={({ isActive }) =>
                [
                  "flex items-center gap-2 rounded-2xl px-2.5 py-2 text-xs font-medium transition",
                  isActive
                    ? "bg-slate-900 text-amber-50 shadow-md"
                    : "text-slate-700 hover:bg-slate-900/5 hover:text-slate-900",
                ].join(" ")
              }
            >
              <span className="text-base">🛠️</span>
              <span>Diagnostics</span>
            </NavLink>
          </div>
        </div>
      </nav>

      <button
        type="button"
        onClick={handleLogout}
        className="mt-auto inline-flex items-center justify-center rounded-full bg-rose-500 px-3 py-2 text-xs font-semibold text-rose-50 shadow-md shadow-rose-300/80 transition hover:bg-rose-600"
      >
        Logout
      </button>
    </aside>
  );
}
