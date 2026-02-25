import { useState, useEffect } from "react";
import api from "../api/axios";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [stats, setStats] = useState({
    totalBooks: "...", activeLoans: "...", unpaidFines: "...", systemViews: "..."
  });
  
  const [analytics, setAnalytics] = useState({
    topSearches: [], topViewed: [], topBorrowed: [], lowConversion: []
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/members/admin/stats", {
            headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
        });
        const data = res.data.data;
        
        setStats({
          totalBooks: data.totalBooks.toString(),
          activeLoans: data.activeLoans.toString(),
          unpaidFines: `₱${data.unpaidFines.toFixed(2)}`,
          systemViews: data.systemViews.toString()
        });

        setAnalytics({
            topSearches: data.topSearches,
            topViewed: data.topViewed,
            topBorrowed: data.topBorrowed,
            lowConversion: data.lowConversion
        });
      } catch (err) {
        setError("Failed to load live statistics.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Helper component for clean tables
  const StatTable = ({ title, data, columns, renderRow }: any) => (
    <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/80 shadow-xl shadow-orange-200/60 backdrop-blur-xl">
      <div className="border-b border-slate-100/80 bg-slate-50/80 px-5 py-3.5">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <table className="w-full border-collapse text-left text-xs text-slate-800 sm:text-sm">
        <thead className="bg-slate-50/80 text-slate-500">
          <tr>
            {columns.map((col: string, i: number) => (
              <th key={i} className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide sm:text-xs">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-5 py-4 text-center text-xs text-slate-500"
              >
                No data available yet.
              </td>
            </tr>
          ) : (
            data.map((item: any, i: number) => renderRow(item, i))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-7 text-slate-900">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Librarian Command Center
        </h2>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">
          Live system diagnostics and behavioral analytics across the catalog.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700 shadow-sm sm:text-sm">
          {error}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-sky-200 bg-white/80 px-4 py-4 shadow-lg shadow-orange-200/60 backdrop-blur-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Total inventory
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            {stats.totalBooks}
          </p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-white/80 px-4 py-4 shadow-lg shadow-orange-200/60 backdrop-blur-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Active loans
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            {stats.activeLoans}
          </p>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-white/80 px-4 py-4 shadow-lg shadow-orange-200/60 backdrop-blur-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Unpaid fines
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-rose-600 sm:text-4xl">
            {stats.unpaidFines}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-white/80 px-4 py-4 shadow-lg shadow-orange-200/60 backdrop-blur-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Catalog views
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            {stats.systemViews}
          </p>
        </div>
      </div>

      {/* Analytics tables */}
      {!loading && (
        <div className="grid gap-4 lg:grid-cols-2">
          <StatTable
            title="🏆 Most Borrowed Books"
            columns={["Title", "Borrows", "Avg Return Time"]}
            data={analytics.topBorrowed}
            renderRow={(item: any, i: number) => (
              <tr key={i} className="border-t border-slate-100">
                <td className="px-5 py-2.5 text-xs font-semibold text-slate-900 sm:text-sm">
                  {item.title}
                </td>
                <td className="px-5 py-2.5 text-xs text-slate-700 sm:text-sm">
                  {item.total_borrows}
                </td>
                <td className="px-5 py-2.5 text-xs text-slate-600 sm:text-sm">
                  {item.avg_return_time_days > 0
                    ? `${item.avg_return_time_days} days`
                    : "N/A"}
                </td>
              </tr>
            )}
          />

          <StatTable
            title="👀 Most Viewed Books"
            columns={["Title", "Views", "Conversion Rate"]}
            data={analytics.topViewed}
            renderRow={(item: any, i: number) => (
              <tr key={i} className="border-t border-slate-100">
                <td className="px-5 py-2.5 text-xs font-semibold text-slate-900 sm:text-sm">
                  {item.title}
                </td>
                <td className="px-5 py-2.5 text-xs text-slate-700 sm:text-sm">
                  {item.total_views}
                </td>
                <td className="px-5 py-2.5 text-xs text-emerald-700 sm:text-sm">
                  {(item.conversion_rate * 100).toFixed(1)}%
                </td>
              </tr>
            )}
          />

          <StatTable
            title="⚠️ Missed Opportunities"
            columns={["Title", "Views", "Borrows"]}
            data={analytics.lowConversion}
            renderRow={(item: any, i: number) => (
              <tr key={i} className="border-t border-slate-100">
                <td className="px-5 py-2.5 text-xs font-semibold text-slate-900 sm:text-sm">
                  {item.title}
                </td>
                <td className="px-5 py-2.5 text-xs text-slate-700 sm:text-sm">
                  {item.total_views}
                </td>
                <td className="px-5 py-2.5 text-xs font-semibold text-rose-700 sm:text-sm">
                  {item.total_borrows}
                </td>
              </tr>
            )}
          />

          <StatTable
            title="🔍 Top Search Queries"
            columns={["Query Data", "Search Count"]}
            data={analytics.topSearches}
            renderRow={(item: any, i: number) => {
              const cleanQuery =
                item.query.split("|")[0].replace("keyword:", "") || "Empty Search";
              return (
                <tr key={i} className="border-t border-slate-100">
                  <td className="px-5 py-2.5 font-mono text-xs text-slate-800 sm:text-sm">
                    "{cleanQuery}"
                  </td>
                  <td className="px-5 py-2.5 text-xs text-slate-700 sm:text-sm">
                    {item.count}
                  </td>
                </tr>
              );
            }}
          />
        </div>
      )}
    </div>
  );
}