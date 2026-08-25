import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { logoutAdmin } from "../api/client";
import { fetchPendingJobs } from "../api/jobs";

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("adminToken");
  const adminUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("adminUser") || "null");
    } catch {
      return null;
    }
  })();

  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!token) navigate("/login", { replace: true });
  }, [token, navigate]);

  useEffect(() => {
    let isMounted = true;
    const checkPending = async () => {
      try {
        if (token) {
          const res = await fetchPendingJobs();
          const jobs = res.data?.jobs || res.jobs || [];
          if (isMounted) setPendingCount(jobs.length);
        }
      } catch {
        // silent fallback
      }
    };
    checkPending();
    const interval = setInterval(checkPending, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [token, location.pathname]);

  const handleLogout = () => {
    logoutAdmin();
    navigate("/login", { replace: true });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getInitials = (name) => {
    if (!name) return "A";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon-wrap">
            <div className="logo-icon">E</div>
            <span className="logo-pulse"></span>
          </div>
          <div className="logo-info">
            <span className="logo-text">Edu<strong>Match</strong></span>
            <span className="logo-badge">Admin Suite</span>
          </div>
        </div>

        <div className="sidebar-section-title">MAIN NAVIGATION</div>

        <nav className="sidebar-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-label">Dashboard</span>
          </NavLink>

          <NavLink
            to="/job-approvals"
            className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
          >
            <span className="nav-icon">✅</span>
            <span className="nav-label">Job Approvals</span>
            {pendingCount > 0 && (
              <span className="nav-badge-pending">{pendingCount}</span>
            )}
          </NavLink>

          <NavLink
            to="/jobs"
            className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
          >
            <span className="nav-icon">💼</span>
            <span className="nav-label">All Jobs</span>
          </NavLink>

          <NavLink
            to="/candidates"
            className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
          >
            <span className="nav-icon">👤</span>
            <span className="nav-label">Candidates</span>
          </NavLink>

          <NavLink
            to="/recruiters"
            className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
          >
            <span className="nav-icon">👥</span>
            <span className="nav-label">Recruiters</span>
          </NavLink>

          <NavLink
            to="/applications"
            className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
          >
            <span className="nav-icon">📄</span>
            <span className="nav-label">Applications</span>
          </NavLink>
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-bottom">
          <div className="sidebar-system-card">
            <div className="system-status-dot"></div>
            <div className="system-status-text">
              <small>System Status</small>
              <strong>Operational & Live</strong>
            </div>
          </div>

          {token ? (
            <button onClick={handleLogout} className="logout-btn">
              <span className="logout-icon">🚪</span>
              <span>Sign Out</span>
            </button>
          ) : (
            <NavLink to="/login" className="nav-item">
              <span className="nav-icon">🔐</span>
              <span>Login</span>
            </NavLink>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <div className="topbar-welcome">
              <span className="greeting-pill">{getGreeting()} 👋</span>
              <h2>Overview & Management</h2>
            </div>
          </div>

          <div className="topbar-right">
            <div className="system-badge">
              <span className="pulse-indicator"></span>
              <span>Production Server</span>
            </div>

            <div className="admin-profile-card">
              <div className="profile-avatar">
                {getInitials(adminUser?.name)}
              </div>
              <div className="profile-details">
                <strong>{adminUser?.name || "Administrator"}</strong>
                <div className="profile-role-tag">
                  <span className="role-dot"></span>
                  <small>{adminUser?.email || "admin@edumatch.com"}</small>
                </div>
              </div>
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
