import { useCallback, useEffect, useState } from "react";
import "./Dashboard.css";
import {
  fetchAllJobs,
  extractApplicationsFromJobs,
  fetchMockInterviewAnalytics,
  getJobStats,
} from "../api/jobs";
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
    pendingJobs: 0,
    activeJobs: 0,
    rejectedJobs: 0,
    closedJobs: 0,
    draftJobs: 0,
  });
  const [interviewAnalytics, setInterviewAnalytics] = useState({
    totalInterviews: 0,
    completedInterviews: 0,
    inProgressInterviews: 0,
    abandonedInterviews: 0,
    completionRate: 0,
    averageReadinessScore: 0,
    averageTechnicalKnowledge: 0,
    averageCommunication: 0,
    averageJobRelevance: 0,
    averageAnswerQuality: 0,
    readinessDistribution: {
      high: 0,
      moderate: 0,
      needsImprovement: 0,
    },
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [usersWarning, setUsersWarning] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setUsersWarning("");

      const [jobs, usersResult, interviewData] = await Promise.all([
        fetchAllJobs(),
        fetchUsersSafely(),
        fetchMockInterviewAnalytics().catch(() => null),
      ]);

      const jobStats = getJobStats(jobs);
      const userStats = getUserStats(usersResult.users);

      if (usersResult.error) {
        setUsersWarning(usersResult.error);
      }

      if (interviewData) {
        setInterviewAnalytics(interviewData);
      }

      setStats({
        totalCandidates: userStats.totalCandidates,
        totalRecruiters: userStats.totalRecruiters,
        totalJobs: jobStats.totalJobs,
        totalApplications: jobStats.totalApplications,
        pendingJobs: jobStats.pendingJobs,
        activeJobs: jobStats.activeJobs,
        rejectedJobs: jobStats.rejectedJobs,
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

      {/* ── AI Interview Analytics Section ──────────────────────────────── */}
      <div className="section-header ai-analytics-header">
        <div>
          <div className="section-title-with-badge">
            <h2>AI Mock Interview Analytics</h2>
            <span className="ai-analytics-badge">⚡ Live Telemetry</span>
          </div>
          <p className="section-subtitle">
            Aggregate candidate readiness, competency benchmarks & performance metrics
          </p>
        </div>
      </div>

      {/* AI Overview Cards */}
      <div className="dashboard-cards ai-cards-grid">
        <div className="stat-card ai-stat-card">
          <div className="stat-icon interview-icon">🎤</div>
          <div>
            <p>Total Interviews</p>
            <h2>{interviewAnalytics.totalInterviews}</h2>
          </div>
        </div>

        <div className="stat-card ai-stat-card">
          <div className="stat-icon completed-icon">✅</div>
          <div>
            <p>Completed Interviews</p>
            <h2>{interviewAnalytics.completedInterviews}</h2>
          </div>
        </div>

        <div className="stat-card ai-stat-card">
          <div className="stat-icon score-icon">🎯</div>
          <div>
            <p>Avg Readiness Score</p>
            <h2>{interviewAnalytics.averageReadinessScore}%</h2>
          </div>
        </div>

        <div className="stat-card ai-stat-card">
          <div className="stat-icon top-icon">⭐</div>
          <div>
            <p>Highly Ready Candidates</p>
            <h2>{interviewAnalytics.readinessDistribution?.high || 0}</h2>
          </div>
        </div>
      </div>

      {/* Analytics 2-Column Detail Layout */}
      <div className="ai-analytics-detail-grid">
        {/* Competency Benchmarks */}
        <div className="ai-detail-card">
          <div className="ai-card-title">
            <span className="ai-title-icon">📊</span>
            <div>
              <h3>Competency Benchmark Averages</h3>
              <p>Performance across all completed candidate interviews</p>
            </div>
          </div>

          <div className="competency-bars-wrap">
            <div className="competency-bar-item">
              <div className="bar-header">
                <span className="bar-label">Technical Knowledge</span>
                <span className="bar-val">{interviewAnalytics.averageTechnicalKnowledge}%</span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill tech-fill"
                  style={{ width: `${Math.min(interviewAnalytics.averageTechnicalKnowledge, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="competency-bar-item">
              <div className="bar-header">
                <span className="bar-label">Communication & Clarity</span>
                <span className="bar-val">{interviewAnalytics.averageCommunication}%</span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill comm-fill"
                  style={{ width: `${Math.min(interviewAnalytics.averageCommunication, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="competency-bar-item">
              <div className="bar-header">
                <span className="bar-label">Job & Domain Relevance</span>
                <span className="bar-val">{interviewAnalytics.averageJobRelevance}%</span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill rel-fill"
                  style={{ width: `${Math.min(interviewAnalytics.averageJobRelevance, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="competency-bar-item">
              <div className="bar-header">
                <span className="bar-label">Answer Quality & Depth</span>
                <span className="bar-val">{interviewAnalytics.averageAnswerQuality}%</span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill qual-fill"
                  style={{ width: `${Math.min(interviewAnalytics.averageAnswerQuality, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Readiness Distribution & Completion Pipeline */}
        <div className="ai-detail-card">
          <div className="ai-card-title">
            <span className="ai-title-icon">🎯</span>
            <div>
              <h3>Readiness Distribution & Pipeline</h3>
              <p>Candidate tier segmentation and session completion status</p>
            </div>
          </div>

          <div className="distribution-tiers-wrap">
            <div className="tier-row high-tier">
              <div className="tier-info">
                <span className="tier-pill high-pill">80–100%</span>
                <span className="tier-name">Highly Ready</span>
              </div>
              <div className="tier-count">
                <strong>{interviewAnalytics.readinessDistribution?.high || 0}</strong> candidates
              </div>
            </div>

            <div className="tier-row mod-tier">
              <div className="tier-info">
                <span className="tier-pill mod-pill">60–79%</span>
                <span className="tier-name">Moderate Readiness</span>
              </div>
              <div className="tier-count">
                <strong>{interviewAnalytics.readinessDistribution?.moderate || 0}</strong> candidates
              </div>
            </div>

            <div className="tier-row low-tier">
              <div className="tier-info">
                <span className="tier-pill low-pill">&lt; 60%</span>
                <span className="tier-name">Needs Improvement</span>
              </div>
              <div className="tier-count">
                <strong>{interviewAnalytics.readinessDistribution?.needsImprovement || 0}</strong> candidates
              </div>
            </div>
          </div>

          {/* Session Pipeline Footer */}
          <div className="pipeline-status-row">
            <div className="pipeline-stat">
              <span className="pipeline-dot completed-dot"></span>
              <span>Completed: <strong>{interviewAnalytics.completedInterviews}</strong></span>
            </div>
            <div className="pipeline-stat">
              <span className="pipeline-dot inprogress-dot"></span>
              <span>In Progress: <strong>{interviewAnalytics.inProgressInterviews}</strong></span>
            </div>
            {interviewAnalytics.abandonedInterviews > 0 && (
              <div className="pipeline-stat">
                <span className="pipeline-dot abandoned-dot"></span>
                <span>Abandoned: <strong>{interviewAnalytics.abandonedInterviews}</strong></span>
              </div>
            )}
            <div className="pipeline-rate">
              <span>Completion: <strong>{interviewAnalytics.completionRate}%</strong></span>
            </div>
          </div>
        </div>
      </div>

      <div className="section-header">
        <h2>Platform Status</h2>
      </div>

      <div className="status-cards" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
        <div className="status-card">
          <div className="status-title">
            <span className="status-dot pending"></span>
            Pending Review
          </div>
          <h2 style={{ color: "#e5a329" }}>{stats.pendingJobs}</h2>
          <p>Jobs awaiting admin approval</p>
        </div>

        <div className="status-card">
          <div className="status-title">
            <span className="status-dot active"></span>
            Active Jobs
          </div>
          <h2 style={{ color: "#28a568" }}>{stats.activeJobs}</h2>
          <p>Approved & visible listings</p>
        </div>

        <div className="status-card">
          <div className="status-title">
            <span className="status-dot inactive"></span>
            Rejected Jobs
          </div>
          <h2 style={{ color: "#dc5963" }}>{stats.rejectedJobs}</h2>
          <p>Jobs rejected by admin</p>
        </div>

        <div className="status-card">
          <div className="status-title">
            <span className="status-dot inactive"></span>
            Closed Jobs
          </div>
          <h2>{stats.closedJobs}</h2>
          <p>No longer accepting applications</p>
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
