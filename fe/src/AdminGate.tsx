import { useEffect, useState } from "react";
import { apiFetch } from "@/api/client";
import AdminApp from "./AdminApp";

/**
 * Renders /admin only if the user has an active staff session.
 * Otherwise redirects to staff login. Prevents any access to admin without logging in.
 */
export default function AdminGate() {
  const [status, setStatus] = useState<"loading" | "allowed" | "denied">("loading");

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        await apiFetch("/api/auth/staff/check", { credentials: "include" });
        if (!cancelled) setStatus("allowed");
      } catch {
        if (!cancelled) setStatus("denied");
      }
    };
    check();
    return () => { cancelled = true; };
  }, []);

  if (status === "denied") {
    window.location.replace("/restricted-staff-auth");
    return null;
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-amber-50">
        <p className="text-slate-600">Checking access…</p>
      </div>
    );
  }

  return <AdminApp />;
}
