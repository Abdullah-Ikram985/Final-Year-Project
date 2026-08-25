import { useCallback, useEffect, useMemo, useState } from "react";
import "./Jobs.css";
import "./JobApprovals.css";
import {
  approveJob,
  deleteJobById,
  fetchAllJobs,
  getJobStats,
  rejectJob,
} from "../api/jobs";
import { formatDate, getJobStatusClass } from "../utils/format";
import { getErrorMessage } from "../api/client";

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");

  // Rejection modal
  const [rejectingJob, setRejectingJob] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

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

  const showToast = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 4500);
  };

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

      const status = (job.jobStatus || "").toLowerCase();

      if (activeTab === "All") return matchesSearch;
      if (activeTab === "Pending") return matchesSearch && status === "pending";
      if (activeTab === "Active") return matchesSearch && status === "active";
      if (activeTab === "Rejected") return matchesSearch && status === "rejected";
      if (activeTab === "Closed") return matchesSearch && status === "closed";
      if (activeTab === "Draft") return matchesSearch && status === "draft";
      return matchesSearch && job.jobStatus === activeTab;
    });
  }, [jobs, search, activeTab]);

  const handleApprove = async (job) => {
    const confirm = window.confirm(`Approve "${job.title}" and make it live?`);
    if (!confirm) return;

    try {
      setActionLoading(true);
      await approveJob(job._id);
      setJobs((prev) =>
        prev.map((j) =>
          j._id === job._id
            ? { ...j, jobStatus: "Active", approvedAt: new Date() }
            : j,
        ),
      );
      showToast(`Job "${job.title}" approved successfully!`);
    } catch (err) {
      alert(getErrorMessage(err, "Failed to approve job."));
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = (job) => {
    setRejectingJob(job);
    setRejectionReason("");
  };

  const handleRejectSubmit = async (e) => {
    e?.preventDefault();
    if (!rejectingJob) return;

    try {
      setActionLoading(true);
      await rejectJob(rejectingJob._id, rejectionReason.trim());
      setJobs((prev) =>
        prev.map((j) =>
          j._id === rejectingJob._id
            ? {
                ...j,
                jobStatus: "Rejected",
                rejectionReason: rejectionReason.trim(),
                rejectedAt: new Date(),
              }
            : j,
        ),
      );
      showToast(`Job "${rejectingJob.title}" rejected.`);
      setRejectingJob(null);
    } catch (err) {
      alert(getErrorMessage(err, "Failed to reject job."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (jobId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this job?");

    if (!confirmDelete) return;

    try {
      await deleteJobById(jobId);
      setJobs((prev) => prev.filter((job) => job._id !== jobId));
      showToast("Job deleted successfully.");
    } catch (err) {
      alert(
        getErrorMessage(
          err,
          "Failed to delete job.",
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
          <h1>Jobs Management</h1>
          <p>Manage all jobs posted on the platform</p>
        </div>

        <button className="refresh-btn" onClick={loadJobs}>
          ↻ Refresh
        </button>
      </div>

      {successMsg && <div className="alert alert-success">{successMsg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="job-stats" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
        <div className="job-stat" style={{ cursor: "pointer" }} onClick={() => setActiveTab("All")}>
          <span>Total Jobs</span>
          <h2>{stats.totalJobs}</h2>
        </div>

        <div className="job-stat" style={{ cursor: "pointer" }} onClick={() => setActiveTab("Pending")}>
          <span>Pending Approval</span>
          <h2 className="pending-number">{stats.pendingJobs}</h2>
        </div>

        <div className="job-stat" style={{ cursor: "pointer" }} onClick={() => setActiveTab("Active")}>
          <span>Active</span>
          <h2 className="active-number">{stats.activeJobs}</h2>
        </div>

        <div className="job-stat" style={{ cursor: "pointer" }} onClick={() => setActiveTab("Rejected")}>
          <span>Rejected</span>
          <h2 className="rejected-number">{stats.rejectedJobs}</h2>
        </div>

        <div className="job-stat" style={{ cursor: "pointer" }} onClick={() => setActiveTab("Closed")}>
          <span>Closed</span>
          <h2 className="closed-number">{stats.closedJobs}</h2>
        </div>
      </div>

      <div className="job-toolbar">
        <div className="job-tabs">
          {["All", "Pending", "Active", "Rejected", "Closed"].map((tab) => (
            <button
              key={tab}
              className={
                activeTab === tab ? "job-tab active-job-tab" : "job-tab"
              }
              onClick={() => setActiveTab(tab)}
            >
              {tab}
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
              filteredJobs.map((job) => {
                const s = (job.jobStatus || "").toLowerCase();
                const isPending = s === "pending";

                return (
                  <tr key={job._id}>
                    <td>
                      <div className="job-name">
                        <div className="job-icon">💼</div>
                        <div>
                          <strong>{job.title || "Untitled Job"}</strong>
                          <small>Job ID: {job._id}</small>
                          {job.rejectionReason && (
                            <small style={{ color: "#dc5963", marginTop: "2px" }}>
                              Reason: {job.rejectionReason}
                            </small>
                          )}
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
                        {job.jobStatus || "Pending"}
                      </span>
                    </td>

                    <td>{formatDate(job.createdAt)}</td>

                    <td>
                      <div className="job-actions" style={{ display: "flex", gap: "6px" }}>
                        {isPending && (
                          <>
                            <button
                              className="btn-approve"
                              title="Approve Job"
                              disabled={actionLoading}
                              onClick={() => handleApprove(job)}
                            >
                              ✓
                            </button>
                            <button
                              className="btn-reject"
                              title="Reject Job"
                              disabled={actionLoading}
                              onClick={() => openRejectModal(job)}
                            >
                              ✕
                            </button>
                          </>
                        )}
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
                );
              })
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

      {/* ── Reject Reason Modal ── */}
      {rejectingJob && (
        <div className="modal-overlay" onClick={() => setRejectingJob(null)}>
          <div
            className="modal-content modal-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>Reject Job Posting</h2>
                <p>Provide a reason for rejecting "{rejectingJob.title}"</p>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setRejectingJob(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRejectSubmit}>
              <div className="modal-body">
                <p style={{ fontSize: "13px", color: "#625a6b", marginBottom: "12px" }}>
                  The recruiter will receive this reason in their notifications:
                </p>
                <textarea
                  className="rejection-input"
                  rows={4}
                  placeholder="e.g. Please specify accurate requirements and department details."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setRejectingJob(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-reject-modal"
                  disabled={actionLoading}
                >
                  {actionLoading ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jobs;
