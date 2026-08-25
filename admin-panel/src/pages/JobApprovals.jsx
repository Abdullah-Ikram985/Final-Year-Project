import { useCallback, useEffect, useMemo, useState } from "react";
import "./JobApprovals.css";
import "./Jobs.css";
import {
  approveJob,
  fetchAdminJobs,
  rejectJob,
} from "../api/jobs";
import { formatDate, getJobStatusClass } from "../utils/format";
import { getErrorMessage } from "../api/client";

const JobApprovals = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [activeTab, setActiveTab] = useState("Pending");
  const [search, setSearch] = useState("");

  // Modal States
  const [selectedJob, setSelectedJob] = useState(null);
  const [rejectingJob, setRejectingJob] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const jobsData = await fetchAdminJobs("All");
      setJobs(jobsData);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load jobs for approval review."));
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
      if (selectedJob?._id === job._id) {
        setSelectedJob((prev) => ({
          ...prev,
          jobStatus: "Active",
          approvedAt: new Date(),
        }));
      }
      showToast(`Job "${job.title}" has been approved and is now live!`);
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
      if (selectedJob?._id === rejectingJob._id) {
        setSelectedJob((prev) => ({
          ...prev,
          jobStatus: "Rejected",
          rejectionReason: rejectionReason.trim(),
          rejectedAt: new Date(),
        }));
      }
      showToast(`Job "${rejectingJob.title}" has been rejected.`);
      setRejectingJob(null);
    } catch (err) {
      alert(getErrorMessage(err, "Failed to reject job."));
    } finally {
      setActionLoading(false);
    }
  };

  const counts = useMemo(() => {
    return {
      pending: jobs.filter((j) => (j.jobStatus || "").toLowerCase() === "pending").length,
      active: jobs.filter((j) => (j.jobStatus || "").toLowerCase() === "active").length,
      rejected: jobs.filter((j) => (j.jobStatus || "").toLowerCase() === "rejected").length,
      all: jobs.length,
    };
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const recruiterName =
        job.createdBy?.companyName ||
        job.createdBy?.user?.name ||
        "";
      const userEmail = job.createdBy?.user?.email || "";

      const searchValue = search.toLowerCase();
      const matchesSearch =
        job.title?.toLowerCase().includes(searchValue) ||
        recruiterName.toLowerCase().includes(searchValue) ||
        userEmail.toLowerCase().includes(searchValue) ||
        job.department?.toLowerCase().includes(searchValue) ||
        job.location?.toLowerCase().includes(searchValue);

      const status = (job.jobStatus || "").toLowerCase();

      if (activeTab === "Pending") return matchesSearch && status === "pending";
      if (activeTab === "Active") return matchesSearch && status === "active";
      if (activeTab === "Rejected") return matchesSearch && status === "rejected";
      return matchesSearch;
    });
  }, [jobs, search, activeTab]);

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Job Approvals</h1>
          <p>Review, approve, or reject job postings submitted by recruiters</p>
        </div>

        <button className="refresh-btn" onClick={loadJobs}>
          ↻ Refresh
        </button>
      </div>

      {successMsg && <div className="alert alert-success">{successMsg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="job-stats">
        <div
          className={`job-stat stat-interactive ${activeTab === "Pending" ? "stat-active-pending" : ""}`}
          onClick={() => setActiveTab("Pending")}
        >
          <span>Pending Review</span>
          <h2 className="pending-number">{counts.pending}</h2>
        </div>

        <div
          className={`job-stat stat-interactive ${activeTab === "Active" ? "stat-active-approved" : ""}`}
          onClick={() => setActiveTab("Active")}
        >
          <span>Approved & Active</span>
          <h2 className="active-number">{counts.active}</h2>
        </div>

        <div
          className={`job-stat stat-interactive ${activeTab === "Rejected" ? "stat-active-rejected" : ""}`}
          onClick={() => setActiveTab("Rejected")}
        >
          <span>Rejected</span>
          <h2 className="rejected-number">{counts.rejected}</h2>
        </div>

        <div
          className={`job-stat stat-interactive ${activeTab === "All" ? "stat-active-all" : ""}`}
          onClick={() => setActiveTab("All")}
        >
          <span>Total Posted</span>
          <h2>{counts.all}</h2>
        </div>
      </div>

      <div className="job-toolbar">
        <div className="job-tabs">
          {[
            { key: "Pending", label: `Pending (${counts.pending})` },
            { key: "Active", label: `Approved (${counts.active})` },
            { key: "Rejected", label: `Rejected (${counts.rejected})` },
            { key: "All", label: `All Jobs (${counts.all})` },
          ].map((tab) => (
            <button
              key={tab.key}
              className={
                activeTab === tab.key ? "job-tab active-job-tab" : "job-tab"
              }
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="job-search">
          🔍
          <input
            type="text"
            placeholder="Search by title, recruiter, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="job-table-container">
        <table>
          <thead>
            <tr>
              <th>Job Title</th>
              <th>Recruiter / Company</th>
              <th>Department</th>
              <th>Location</th>
              <th>Type</th>
              <th>Created Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="job-no-data">
                  Loading jobs for review...
                </td>
              </tr>
            ) : filteredJobs.length > 0 ? (
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
                          <small>ID: {job._id}</small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div>
                        <strong>
                          {job.createdBy?.companyName ||
                            job.createdBy?.user?.name ||
                            "N/A"}
                        </strong>
                        {job.createdBy?.user?.email && (
                          <small style={{ display: "block", color: "#8a8196" }}>
                            {job.createdBy.user.email}
                          </small>
                        )}
                      </div>
                    </td>

                    <td>{job.department || "—"}</td>

                    <td>📍 {job.location || "—"}</td>

                    <td>
                      <span className="job-type">{job.jobType || "Full-time"}</span>
                    </td>

                    <td>{formatDate(job.createdAt)}</td>

                    <td>
                      <span className={`job-status ${getJobStatusClass(job.jobStatus)}`}>
                        {job.jobStatus || "Pending"}
                      </span>
                    </td>

                    <td>
                      <div className="approval-actions">
                        <button
                          className="btn-view"
                          title="View Full Details"
                          onClick={() => setSelectedJob(job)}
                        >
                          👁️ View
                        </button>

                        {isPending && (
                          <>
                            <button
                              className="btn-approve"
                              title="Approve Job"
                              disabled={actionLoading}
                              onClick={() => handleApprove(job)}
                            >
                              ✓ Approve
                            </button>
                            <button
                              className="btn-reject"
                              title="Reject Job"
                              disabled={actionLoading}
                              onClick={() => openRejectModal(job)}
                            >
                              ✕ Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" className="job-no-data">
                  {activeTab === "Pending"
                    ? "🎉 No pending jobs awaiting approval!"
                    : "No jobs found for this filter."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── View Details Modal ── */}
      {selectedJob && (
        <div className="modal-overlay" onClick={() => setSelectedJob(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{selectedJob.title}</h2>
                <p>
                  Posted by{" "}
                  <strong>
                    {selectedJob.createdBy?.companyName ||
                      selectedJob.createdBy?.user?.name ||
                      "Recruiter"}
                  </strong>{" "}
                  on {formatDate(selectedJob.createdAt)}
                </p>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setSelectedJob(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-status-banner">
                <span>Current Status:</span>
                <span
                  className={`job-status ${getJobStatusClass(selectedJob.jobStatus)}`}
                >
                  {selectedJob.jobStatus || "Pending"}
                </span>
                {selectedJob.rejectionReason && (
                  <div className="rejection-reason-callout">
                    <strong>Rejection Reason:</strong> {selectedJob.rejectionReason}
                  </div>
                )}
              </div>

              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Department</span>
                  <span className="detail-value">{selectedJob.department || "—"}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Location</span>
                  <span className="detail-value">📍 {selectedJob.location || "—"}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Job Type</span>
                  <span className="detail-value">{selectedJob.jobType || "—"}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Salary (PKR / Year)</span>
                  <span className="detail-value">
                    {selectedJob.salary
                      ? `Rs. ${Number(selectedJob.salary).toLocaleString()}`
                      : "Not specified"}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Recruiter Contact</span>
                  <span className="detail-value">
                    {selectedJob.createdBy?.user?.email || "—"}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Total Applicants</span>
                  <span className="detail-value">
                    {selectedJob.applicants?.length || 0}
                  </span>
                </div>
              </div>

              {selectedJob.skills && selectedJob.skills.length > 0 && (
                <div className="detail-section">
                  <h4>Required Skills</h4>
                  <div className="skills-tags">
                    {selectedJob.skills.map((skill, idx) => (
                      <span key={idx} className="skill-tag">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="detail-section">
                <h4>Job Description</h4>
                <div className="description-box">
                  {selectedJob.description || "No description provided."}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setSelectedJob(null)}
              >
                Close
              </button>

              {(selectedJob.jobStatus || "").toLowerCase() === "pending" && (
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    className="btn-reject-modal"
                    onClick={() => openRejectModal(selectedJob)}
                  >
                    Reject Job
                  </button>
                  <button
                    className="btn-approve-modal"
                    onClick={() => handleApprove(selectedJob)}
                  >
                    ✓ Approve & Make Live
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
                  placeholder="e.g. Please provide a more detailed job description and valid department name."
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

export default JobApprovals;
