import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { logoutAdmin } from "../api/client";

const AdminLayout = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("adminToken");
  const adminUser = (() => {
    try { return JSON.parse(localStorage.getItem("adminUser") || "null"); } catch { return null; }
  })();

  useEffect(() => {
    if (!token) navigate("/login", { replace: true });
  }, [token, navigate]);

  const handleLogout = () => {
    logoutAdmin();
    navigate("/login", { replace: true });
  };

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon">A</div>
          <span>AdminPanel</span>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
          >
            <span>📊</span>
            Dashboard
          </NavLink>

          <NavLink
            to="/candidates"
            className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
          >
            <span>👤</span>
            Candidates
          </NavLink>

          <NavLink
            to="/recruiters"
            className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
          >
            <span>👥</span>
            Recruiters
          </NavLink>

          <NavLink
            to="/jobs"
            className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
          >
            <span>💼</span>
            Jobs
          </NavLink>

          <NavLink
            to="/applications"
            className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
          >
            <span>📄</span>
            Applications
          </NavLink>
        </nav>

        <div className="sidebar-bottom">
          {token ? (
            <button onClick={handleLogout} className="nav-item" style={{ width: "100%", border: "none", cursor: "pointer", background: "transparent", textAlign: "left" }}>
              <span>🚪</span>
              Logout
            </button>
          ) : (
            <NavLink to="/login" className="nav-item">
              <span>🔐</span>
              Login
            </NavLink>
          )}
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div>
            <h2>Admin Panel</h2>
            <p>Manage your platform</p>
          </div>

          <div className="admin-profile">
            <div className="profile-avatar">A</div>
            <div>
              <strong>{adminUser?.name || "Admin"}</strong>
              <small>{adminUser?.email || "Administrator"}</small>
            </div>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
