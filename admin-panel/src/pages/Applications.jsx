import { useCallback, useEffect, useMemo, useState } from "react";
import "./Applications.css";
import {
  extractApplicationsFromJobs,
  fetchAllJobs,
} from "../api/jobs";
import {
  formatDate,
  formatStatusLabel,
  getApplicationStatusClass,
} from "../utils/format";
import { getErrorMessage } from "../api/client";

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");

  const loadApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const jobs = await fetchAllJobs();
      setApplications(extractApplicationsFromJobs(jobs));
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load applications."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const stats = useMemo(() => {
    return {
      total: applications.length,
      pending: applications.filter((item) => item.status === "pending").length,
      shortlisted: applications.filter((item) => item.status === "shortlisted")
        .length,
      rejected: applications.filter((item) => item.status === "rejected").length,
    };
  }, [applications]);

  const filteredApplications = useMemo(() => {
    return applications.filter((application) => {
      const searchValue = search.toLowerCase();
      const matchesSearch =
        application.jobTitle?.toLowerCase().includes(searchValue) ||
        application.recruiterName?.toLowerCase().includes(searchValue) ||
        String(application.candidateProfileId || "")
          .toLowerCase()
          .includes(searchValue);

      if (activeTab === "All") return matchesSearch;
      return matchesSearch && application.status === activeTab.toLowerCase();
    });
  }, [applications, search, activeTab]);

  if (loading) {
    return (
      <div className="page-content">
        <h1>Applications</h1>
        <p>Loading applications...</p>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Applications</h1>
          <p>All job applications collected from backend jobs data</p>
        </div>

        <button className="refresh-btn" onClick={loadApplications}>
          Refresh
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="application-stats">
        <div className="application-stat">
          <span>Total Applications</span>
          <h2>{stats.total}</h2>
        </div>

        <div className="application-stat">
          <span>Pending</span>
          <h2 className="pending-number">{stats.pending}</h2>
        </div>

        <div className="application-stat">
          <span>Shortlisted</span>
          <h2 className="active-number">{stats.shortlisted}</h2>
        </div>

        <div className="application-stat">
          <span>Rejected</span>
          <h2 className="inactive-number">{stats.rejected}</h2>
        </div>
      </div>

      <div className="application-toolbar">
        <div className="application-tabs">
          {["All", "pending", "reviewed", "shortlisted", "rejected", "hired"].map(
            (tab) => (
              <button
                key={tab}
                className={
                  activeTab === tab ? "application-tab active-application-tab" : "application-tab"
                }
                onClick={() => setActiveTab(tab)}
              >
                {tab === "All" ? "All" : formatStatusLabel(tab)}
              </button>
            ),
          )}
        </div>

        <div className="application-search">
          🔍
          <input
            type="text"
            placeholder="Search applications..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      <div className="application-table-container">
        <table>
          <thead>
            <tr>
              <th>Candidate Profile</th>
              <th>Job</th>
              <th>Recruiter</th>
              <th>Status</th>
              <th>Applied Date</th>
            </tr>
          </thead>

          <tbody>
            {filteredApplications.length > 0 ? (
              filteredApplications.map((application) => (
                <tr key={application.id}>
                  <td>{application.candidateProfileId || "N/A"}</td>
                  <td>{application.jobTitle}</td>
                  <td>{application.recruiterName}</td>
                  <td>
                    <span
                      className={`application-status ${getApplicationStatusClass(
                        application.status,
                      )}`}
                    >
                      {formatStatusLabel(application.status)}
                    </span>
                  </td>
                  <td>{formatDate(application.appliedAt)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="application-no-data">
                  No applications found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Applications;
