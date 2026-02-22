import { type ReactNode } from "react";
import { useAuth } from "./context/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isReady } = useAuth();

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 font-sans text-slate-600">
        <p>Loading…</p>
      </div>
    );
  }

  if (!user) {
    window.location.href = "/restricted-staff-auth";
    return null;
  }

  return <>{children}</>;
}
