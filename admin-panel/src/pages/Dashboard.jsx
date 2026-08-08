import { useCallback, useEffect, useState } from "react";
import "./Dashboard.css";
import { fetchAllJobs, extractApplicationsFromJobs, getJobStats } from "../api/jobs";
import { fetchUsersSafely, getUserStats } from "../api/users";
import { formatDate } from "../utils/format";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    totalCandidates: 0,
    totalRecruiters: 0,
    totalJobs: 0,
    totalApplications: 0,
    activeJobs: 0,
    closedJobs: 0,
    draftJobs: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [usersWarning, setUsersWarning] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setUsersWarning("");

      const [jobs, usersResult] = await Promise.all([
        fetchAllJobs(),
        fetchUsersSafely(),
      ]);

      const jobStats = getJobStats(jobs);
      const userStats = getUserStats(usersResult.users);

      if (usersResult.error) {
        setUsersWarning(usersResult.error);
      }

      setStats({
        totalCandidates: userStats.totalCandidates,
        totalRecruiters: userStats.totalRecruiters,
        totalJobs: jobStats.totalJobs,
        totalApplications: jobStats.totalApplications,
        activeJobs: jobStats.activeJobs,
        closedJobs: jobStats.closedJobs,
        draftJobs: jobStats.draftJobs,
      });

      const recentJobs = [...jobs]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3)
        .map((job) => ({
          id: job._id,
          title: job.title,
          subtitle: `New job posted by ${job.createdBy?.user?.name || job.createdBy?.companyName || "Recruiter"}`,
          time: formatDate(job.createdAt),
        }));

      const recentUsers = usersResult.users
        .slice()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3)
        .map((user) => ({
          id: user._id,
          title: user.name || "User",
          subtitle: `New ${user.role} registered`,
          time: formatDate(user.createdAt),
        }));

      const recentApplications = extractApplicationsFromJobs(jobs)
        .slice(0, 3)
        .map((application) => ({
          id: application.id,
          title: application.jobTitle,
          subtitle: `Application status: ${application.status}`,
          time: formatDate(application.appliedAt),
        }));

      setRecentActivity(
        [...recentUsers, ...recentJobs, ...recentApplications].slice(0, 6),
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load dashboard data from backend.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return (
      <div className="page-content">
        <h1>Dashboard</h1>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Platform overview from backend data</p>
        </div>

        <button className="refresh-btn" onClick={loadDashboard}>
          ↻ Refresh
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {usersWarning && <div className="alert alert-warning">{usersWarning}</div>}

      <div className="dashboard-cards">
        <div className="stat-card">
          <div className="stat-icon candidate-icon">👤</div>
          <div>
            <p>Total Candidates</p>
            <h2>{stats.totalCandidates}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon recruiter-icon">👥</div>
          <div>
            <p>Total Recruiters</p>
            <h2>{stats.totalRecruiters}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon job-icon">💼</div>
          <div>
            <p>Total Jobs</p>
            <h2>{stats.totalJobs}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon application-icon">📄</div>
          <div>
            <p>Total Applications</p>
            <h2>{stats.totalApplications}</h2>
          </div>
        </div>
      </div>

      <div className="section-header">
        <h2>Platform Status</h2>
      </div>

      <div className="status-cards">
        <div className="status-card">
          <div className="status-title">
            <span className="status-dot active"></span>
            Active Jobs
          </div>
          <h2>{stats.activeJobs}</h2>
          <p>Currently open job listings</p>
        </div>

        <div className="status-card">
          <div className="status-title">
            <span className="status-dot pending"></span>
            Draft Jobs
          </div>
          <h2>{stats.draftJobs}</h2>
          <p>Jobs saved as draft</p>
        </div>

        <div className="status-card">
          <div className="status-title">
            <span className="status-dot inactive"></span>
            Closed Jobs
          </div>
          <h2>{stats.closedJobs}</h2>
          <p>Jobs no longer accepting applications</p>
        </div>
      </div>

      <div className="section-header">
        <h2>Recent Activity</h2>
      </div>

      <div className="activity-card">
        {recentActivity.length === 0 ? (
          <div className="empty-state">No recent activity found.</div>
        ) : (
          recentActivity.map((item) => (
            <div className="activity-row" key={item.id}>
              <div className="activity-avatar">
                {(item.title || "A").charAt(0).toUpperCase()}
              </div>

              <div className="activity-info">
                <strong>{item.title}</strong>
                <p>{item.subtitle}</p>
              </div>

              <span className="activity-time">{item.time}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;
