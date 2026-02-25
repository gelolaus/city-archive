import { NavLink, useNavigate } from "react-router-dom";
import type { CSSProperties } from "react";

const sidebarStyle: CSSProperties = {
  width: "260px",
  backgroundColor: "#0f172a",
  color: "white",
  padding: "24px 20px",
  display: "flex",
  flexDirection: "column",
  gap: "24px",
  boxSizing: "border-box",
};

const sectionTitleStyle: CSSProperties = {
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#9ca3af",
  marginBottom: "8px",
};

const navSectionStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
};

const linkBaseStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "8px 10px",
  borderRadius: "6px",
  fontSize: "14px",
  textDecoration: "none",
  color: "white",
  cursor: "pointer",
};

const logoutButtonStyle: CSSProperties = {
  marginTop: "auto",
  padding: "10px 12px",
  borderRadius: "6px",
  border: "none",
  backgroundColor: "#ef4444",
  color: "white",
  fontWeight: 600,
  cursor: "pointer",
};

function navLinkStyle({ isActive }: { isActive: boolean }): CSSProperties {
  return {
    ...linkBaseStyle,
    backgroundColor: isActive ? "#020617" : "transparent",
    color: isActive ? "#38bdf8" : "white",
  };
}

export default function AdminSidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("role");
    navigate("/admin/login");
  };

  return (
    <aside style={sidebarStyle}>
      <div>
        <h2 style={{ fontSize: "18px", margin: 0 }}>Staff Panel</h2>
        <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#9ca3af" }}>
          Library Operations Console
        </p>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        <div>
          <p style={sectionTitleStyle}>Overview</p>
          <div style={navSectionStyle}>
            <NavLink to="/admin/dashboard" style={navLinkStyle}>
              <span>📊</span>
              <span>Stats Overview</span>
            </NavLink>
          </div>
        </div>

        <div>
          <p style={sectionTitleStyle}>Circulation</p>
          <div style={navSectionStyle}>
            <NavLink to="/admin/loans" style={navLinkStyle}>
              <span>🤝</span>
              <span>Loans Dashboard</span>
            </NavLink>
            <NavLink to="/admin/fines" style={navLinkStyle}>
              <span>💳</span>
              <span>Settle Fines</span>
            </NavLink>
          </div>
        </div>

        <div>
          <p style={sectionTitleStyle}>Management</p>
          <div style={navSectionStyle}>
            <NavLink to="/admin/books" style={navLinkStyle}>
              <span>📖</span>
              <span>Manage Books</span>
            </NavLink>
            <NavLink to="/admin/authors" style={navLinkStyle}>
              <span>✍️</span>
              <span>Manage Authors</span>
            </NavLink>
            <NavLink to="/admin/members" style={navLinkStyle}>
              <span>👤</span>
              <span>Manage Members</span>
            </NavLink>
          </div>
        </div>

        <div>
          <p style={sectionTitleStyle}>System</p>
          <div style={navSectionStyle}>
            <NavLink to="/admin/diagnostics" style={navLinkStyle}>
              <span>🛠️</span>
              <span>Diagnostics</span>
            </NavLink>
          </div>
        </div>
      </nav>

      <button type="button" onClick={handleLogout} style={logoutButtonStyle}>
        Logout
      </button>
    </aside>
  );
}

