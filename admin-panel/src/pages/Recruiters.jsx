import { useCallback, useEffect, useMemo, useState } from "react";
import "./Recruiters.css";
import {
  deleteUserById,
  fetchUsersSafely,
  filterRecruiters,
} from "../api/users";
import {
  extractRecruitersFromJobs,
  fetchAllJobs,
} from "../api/jobs";
import { getErrorMessage } from "../api/client";

const Recruiters = () => {
  const [recruiters, setRecruiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");

  const loadRecruiters = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setWarning("");

      const jobs = await fetchAllJobs();
      const recruitersFromJobs = extractRecruitersFromJobs(jobs);
      const { users, error: usersError } = await fetchUsersSafely();
      const recruiterUsers = filterRecruiters(users);

      if (usersError) {
        setWarning(usersError);
        setRecruiters(recruitersFromJobs);
        return;
      }

      const mergedRecruiters = recruiterUsers.map((user) => {
        const jobData = recruitersFromJobs.find(
          (recruiter) => recruiter.userId === user._id,
        );

        return {
          userId: user._id,
          name: user.name || "N/A",
          email: user.email || "N/A",
          company: jobData?.company || "N/A",
          jobs: jobData?.jobs || 0,
          activeJobs: jobData?.activeJobs || 0,
          createdAt: user.createdAt,
        };
      });

      setRecruiters(mergedRecruiters);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load recruiters."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecruiters();
  }, [loadRecruiters]);

  const filteredRecruiters = useMemo(() => {
    return recruiters.filter((recruiter) => {
      const searchValue = search.toLowerCase();
      const matchesSearch =
        recruiter.name?.toLowerCase().includes(searchValue) ||
        recruiter.email?.toLowerCase().includes(searchValue) ||
        recruiter.company?.toLowerCase().includes(searchValue);

      if (activeTab === "All") return matchesSearch;
      if (activeTab === "Active") return matchesSearch && recruiter.activeJobs > 0;
      if (activeTab === "Pending") return false;
      if (activeTab === "Inactive") return matchesSearch && recruiter.jobs === 0;

      return matchesSearch;
    });
  }, [recruiters, search, activeTab]);

  const stats = useMemo(() => {
    return {
      total: recruiters.length,
      active: recruiters.filter((recruiter) => recruiter.activeJobs > 0).length,
      withJobs: recruiters.filter((recruiter) => recruiter.jobs > 0).length,
      withoutJobs: recruiters.filter((recruiter) => recruiter.jobs === 0).length,
    };
  }, [recruiters]);

  const handleDelete = async (userId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this recruiter?",
    );

    if (!confirmDelete) return;

    try {
      await deleteUserById(userId);
      setRecruiters((prev) =>
        prev.filter((recruiter) => recruiter.userId !== userId),
      );
      alert("Recruiter deleted successfully.");
    } catch (err) {
      alert(getErrorMessage(err, "Failed to delete recruiter."));
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        <h1>Recruiters</h1>
        <p>Loading recruiters...</p>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Recruiters</h1>
          <p>Manage all recruiters registered on the platform</p>
        </div>

        <button className="refresh-btn" onClick={loadRecruiters}>
          Refresh
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {warning && <div className="alert alert-warning">{warning}</div>}

      <div className="recruiter-stats">
        <div className="recruiter-stat">
          <span className="stat-label">Total Recruiters</span>
          <h2>{stats.total}</h2>
        </div>

        <div className="recruiter-stat">
          <span className="stat-label">With Active Jobs</span>
          <h2 className="active-number">{stats.active}</h2>
        </div>

        <div className="recruiter-stat">
          <span className="stat-label">With Jobs</span>
          <h2 className="pending-number">{stats.withJobs}</h2>
        </div>

        <div className="recruiter-stat">
          <span className="stat-label">Without Jobs</span>
          <h2 className="inactive-number">{stats.withoutJobs}</h2>
        </div>
      </div>

      <div className="recruiter-toolbar">
        <div className="recruiter-tabs">
          {["All", "Active", "Pending", "Inactive"].map((tab) => (
            <button
              key={tab}
              className={activeTab === tab ? "tab active-tab" : "tab"}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="search-box">
          🔍
          <input
            type="text"
            placeholder="Search recruiter..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Recruiter</th>
              <th>Company</th>
              <th>Email</th>
              <th>Jobs</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredRecruiters.length > 0 ? (
              filteredRecruiters.map((recruiter) => (
                <tr key={recruiter.userId}>
                  <td>
                    <div className="recruiter-name">
                      <div className="recruiter-avatar">
                        {(recruiter.name || "R").charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <strong>{recruiter.name}</strong>
                        <small>ID: {recruiter.userId}</small>
                      </div>
                    </div>
                  </td>

                  <td>{recruiter.company}</td>
                  <td>{recruiter.email}</td>
                  <td>
                    <strong>{recruiter.jobs}</strong>
                  </td>

                  <td>
                    <span
                      className={`status-badge ${
                        recruiter.activeJobs > 0 ? "active" : "inactive"
                      }`}
                    >
                      {recruiter.activeJobs > 0 ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td>
                    <div className="action-buttons">
                      <button
                        className="delete-btn"
                        title="Delete"
                        onClick={() => handleDelete(recruiter.userId)}
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-data">
                  No recruiters found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Recruiters;
