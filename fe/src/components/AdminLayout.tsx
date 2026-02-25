import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout() {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        fontFamily: "sans-serif",
        backgroundColor: "#0b1120",
      }}
    >
      <AdminSidebar />

      <div
        style={{
          flex: 1,
          backgroundColor: "#f8fafc",
          overflowY: "auto",
        }}
      >
        <div style={{ padding: "40px" }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

