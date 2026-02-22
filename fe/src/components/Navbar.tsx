import { type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";

interface NavbarProps {
  leftContent: ReactNode;
}

export default function Navbar({ leftContent }: NavbarProps) {
  const { user, isReady, logout } = useAuth();

  return (
    <header className="flex justify-center pt-6 sm:pt-8">
      <nav className="inline-flex w-full max-w-7xl items-center justify-between rounded-full border border-white/60 bg-white/70 px-4 py-2 shadow-2xl shadow-orange-200/60 ring-1 ring-white/50 backdrop-blur-2xl sm:px-6 sm:py-2.5">
        <div className="flex items-center gap-2 text-sm font-semibold tracking-tight text-slate-800 sm:gap-3 sm:text-base">
          {leftContent}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {isReady && user ? (
            <>
              <span className="text-sm font-medium text-slate-700 sm:text-base">
                Hello, {user.first_name}
              </span>
              <button
                type="button"
                onClick={logout}
                className="inline-flex transform items-center rounded-full border border-white/60 bg-white/60 px-4 py-1.5 text-sm font-medium text-slate-800 shadow-sm transition duration-200 ease-out hover:-translate-y-px hover:bg-white/80 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300/80 focus-visible:ring-offset-0"
              >
                Logout
              </button>
            </>
          ) : (
            <a
              href="/restricted-staff-auth"
              className="inline-flex transform items-center rounded-full border border-white/60 bg-white/60 px-4 py-1.5 text-sm font-medium text-slate-800 shadow-sm transition duration-200 ease-out hover:-translate-y-px hover:bg-white/80 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300/80 focus-visible:ring-offset-0"
            >
              Login
            </a>
          )}
        </div>
      </nav>
    </header>
  );
}
