import { useCallback, useEffect, useMemo, useState } from "react";
import "./Jobs.css";
import { deleteJobById, fetchAllJobs, getJobStats } from "../api/jobs";
import { formatDate, getJobStatusClass } from "../utils/format";
import { getErrorMessage } from "../api/client";

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");

  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const jobsData = await fetchAllJobs();
      setJobs(jobsData);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load jobs."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const stats = useMemo(() => getJobStats(jobs), [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const recruiterName =
        job.createdBy?.companyName ||
        job.createdBy?.user?.name ||
        "";

      const searchValue = search.toLowerCase();
      const matchesSearch =
        job.title?.toLowerCase().includes(searchValue) ||
        recruiterName.toLowerCase().includes(searchValue) ||
        job.location?.toLowerCase().includes(searchValue);

      if (activeTab === "All") return matchesSearch;
      return matchesSearch && job.jobStatus === activeTab;
    });
  }, [jobs, search, activeTab]);

  const handleDelete = async (jobId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this job?");

    if (!confirmDelete) return;

    try {
      await deleteJobById(jobId);
      setJobs((prev) => prev.filter((job) => job._id !== jobId));
      alert("Job deleted successfully.");
    } catch (err) {
      alert(
        getErrorMessage(
          err,
          "Failed to delete job. This action may require recruiter authentication.",
        ),
      );
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        <h1>Jobs</h1>
        <p>Loading jobs...</p>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Jobs</h1>
          <p>Manage all jobs posted on the platform</p>
        </div>

        <button className="refresh-btn" onClick={loadJobs}>
          Refresh
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="job-stats">
        <div className="job-stat">
          <span>Total Jobs</span>
          <h2>{stats.totalJobs}</h2>
        </div>

        <div className="job-stat">
          <span>Active Jobs</span>
          <h2 className="active-number">{stats.activeJobs}</h2>
        </div>

        <div className="job-stat">
          <span>Draft Jobs</span>
          <h2 className="pending-number">{stats.draftJobs}</h2>
        </div>

        <div className="job-stat">
          <span>Closed Jobs</span>
          <h2 className="closed-number">{stats.closedJobs}</h2>
        </div>
      </div>

      <div className="job-toolbar">
        <div className="job-tabs">
          {["All", "Active", "Draft", "Closed"].map((tab) => (
            <button
              key={tab}
              className={
                activeTab === tab ? "job-tab active-job-tab" : "job-tab"
              }
              onClick={() => setActiveTab(tab)}
            >
              {tab === "Draft" ? "Pending" : tab}
            </button>
          ))}
        </div>

        <div className="job-search">
          🔍
          <input
            type="text"
            placeholder="Search jobs..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      <div className="job-table-container">
        <table>
          <thead>
            <tr>
              <th>Job</th>
              <th>Recruiter</th>
              <th>Location</th>
              <th>Type</th>
              <th>Applications</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredJobs.length > 0 ? (
              filteredJobs.map((job) => (
                <tr key={job._id}>
                  <td>
                    <div className="job-name">
                      <div className="job-icon">💼</div>
                      <div>
                        <strong>{job.title || "Untitled Job"}</strong>
                        <small>Job ID: {job._id}</small>
                      </div>
                    </div>
                  </td>

                  <td>
                    {job.createdBy?.companyName ||
                      job.createdBy?.user?.name ||
                      "N/A"}
                  </td>

                  <td>📍 {job.location || "N/A"}</td>

                  <td>
                    <span className="job-type">{job.jobType || "N/A"}</span>
                  </td>

                  <td>
                    <strong>{job.applicants?.length || 0}</strong>
                  </td>

                  <td>
                    <span
                      className={`job-status ${getJobStatusClass(job.jobStatus)}`}
                    >
                      {job.jobStatus || "N/A"}
                    </span>
                  </td>

                  <td>{formatDate(job.createdAt)}</td>

                  <td>
                    <div className="job-actions">
                      <button
                        className="job-delete"
                        title="Delete"
                        onClick={() => handleDelete(job._id)}
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="job-no-data">
                  No jobs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Jobs;
