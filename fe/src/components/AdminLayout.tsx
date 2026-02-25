import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-amber-100 font-sans text-slate-900">
      {/* Reuse the warm acrylic background mesh from the public layout */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-[56rem] w-[56rem] -translate-x-1/2 rounded-full bg-amber-300/80 blur-3xl" />
        <div className="absolute -left-40 top-10 h-[48rem] w-[48rem] rounded-full bg-rose-300/75 blur-3xl" />
        <div className="absolute -right-40 top-32 h-[52rem] w-[52rem] rounded-full bg-orange-300/70 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 h-[52rem] w-[52rem] -translate-x-1/2 rounded-full bg-pink-300/70 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[40rem] w-[40rem] rounded-full bg-yellow-200/60 blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-screen">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto px-3 py-6 sm:px-5 lg:px-8">
          <div className="mx-auto flex w-full max-w-7xl flex-col space-y-6 rounded-3xl border border-white/60 bg-white/80 p-4 shadow-2xl shadow-orange-200/70 ring-1 ring-white/60 backdrop-blur-2xl sm:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

