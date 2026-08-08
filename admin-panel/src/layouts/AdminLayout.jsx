import { NavLink, Outlet } from "react-router-dom";

const AdminLayout = () => {
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
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <span>📊</span>
            Dashboard
          </NavLink>

          <NavLink
            to="/candidates"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <span>👤</span>
            Candidates
          </NavLink>

          <NavLink
            to="/recruiters"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <span>👥</span>
            Recruiters
          </NavLink>

          <NavLink
            to="/jobs"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <span>💼</span>
            Jobs
          </NavLink>

          <NavLink
            to="/applications"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <span>📄</span>
            Applications
          </NavLink>
        </nav>

        <div className="sidebar-bottom">
          <NavLink to="/login" className="nav-item">
            <span>🔐</span>
            Login
          </NavLink>
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
              <strong>Admin</strong>
              <small>Administrator</small>
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
