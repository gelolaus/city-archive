import { useState } from "react";
import { Toaster } from "sonner";
import { useAuth } from "@/context/AuthContext";
import CirculationDeskPage from "./CirculationDeskPage";
import CTODashboardPage from "./CTODashboardPage";
import CatalogingPage from "./CatalogingPage";
import MemberRegistrationPage from "./MemberRegistrationPage";
import FinancialSettlementPage from "./FinancialSettlementPage";

type AdminPage = "cto" | "circulation" | "cataloging" | "member-registration" | "financial-settlement";

export default function AdminApp() {
  const [adminPage, setAdminPage] = useState<AdminPage>("cto");
  const { user, logout } = useAuth();

  const greetingBar = (
    <div className="fixed left-[15rem] right-0 top-0 z-30 flex items-center justify-end border-b border-white/40 bg-amber-100/95 px-4 py-2 backdrop-blur-sm">
      <span className="text-sm font-medium text-slate-700">
        Hello, {user?.first_name}
      </span>
    </div>
  );

  if (adminPage === "cto") {
    return (
      <>
        <Toaster position="top-right" richColors />
        {greetingBar}
        <CTODashboardPage onNavigate={setAdminPage} onLogout={logout} />
      </>
    );
  }
  if (adminPage === "cataloging") {
    return (
      <>
        <Toaster position="top-right" richColors />
        {greetingBar}
        <CatalogingPage onLogout={logout} onNavigate={setAdminPage} />
      </>
    );
  }
  if (adminPage === "circulation") {
    return (
      <>
        <Toaster position="top-right" richColors />
        {greetingBar}
        <CirculationDeskPage onLogout={logout} onNavigate={setAdminPage} />
      </>
    );
  }
  if (adminPage === "member-registration") {
    return (
      <>
        <Toaster position="top-right" richColors />
        {greetingBar}
        <MemberRegistrationPage onNavigate={setAdminPage} onLogout={logout} />
      </>
    );
  }
  if (adminPage === "financial-settlement") {
    return (
      <>
        <Toaster position="top-right" richColors />
        {greetingBar}
        <FinancialSettlementPage onNavigate={setAdminPage} onLogout={logout} />
      </>
    );
  }
  return null;
}
