import { useCallback, useEffect, useMemo, useState } from "react";
import "./Candidates.css";
import { deleteUserById, fetchUsersSafely, filterCandidates } from "../api/users";
import { getErrorMessage } from "../api/client";

const Candidates = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");

  const loadCandidates = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const { users, error: usersError } = await fetchUsersSafely();

      if (usersError) {
        setError(usersError);
        setCandidates([]);
        return;
      }

      setCandidates(filterCandidates(users));
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load candidates."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  const filteredCandidates = useMemo(() => {
    return candidates.filter((candidate) => {
      const searchValue = search.toLowerCase();
      const matchesSearch =
        candidate.name?.toLowerCase().includes(searchValue) ||
        candidate.email?.toLowerCase().includes(searchValue);

      if (activeTab === "All") return matchesSearch;
      if (activeTab === "Active") return matchesSearch;
      if (activeTab === "Pending") return false;
      if (activeTab === "Inactive") return false;

      return matchesSearch;
    });
  }, [candidates, search, activeTab]);

  const handleDelete = async (userId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this candidate?",
    );

    if (!confirmDelete) return;

    try {
      await deleteUserById(userId);
      setCandidates((prev) => prev.filter((candidate) => candidate._id !== userId));
      alert("Candidate deleted successfully.");
    } catch (err) {
      alert(getErrorMessage(err, "Failed to delete candidate."));
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        <h1>Candidates</h1>
        <p>Loading candidates...</p>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>All Candidates</h1>
          <p>Manage all registered candidates</p>
        </div>

        <button className="refresh-btn" onClick={loadCandidates}>
          Refresh
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="candidate-stats">
        <div className="candidate-stat">
          <span>Total Candidates</span>
          <h2>{candidates.length}</h2>
        </div>
      </div>

      <div className="candidate-toolbar">
        <div className="candidate-tabs">
          {["All", "Active", "Pending", "Inactive"].map((tab) => (
            <button
              key={tab}
              className={
                activeTab === tab ? "candidate-tab active-candidate-tab" : "candidate-tab"
              }
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="candidate-search">
          🔍
          <input
            type="text"
            placeholder="Search candidate..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      <div className="candidate-table-container">
        <table>
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredCandidates.length === 0 ? (
              <tr>
                <td colSpan="5" className="candidate-no-data">
                  No candidates found.
                </td>
              </tr>
            ) : (
              filteredCandidates.map((candidate) => (
                <tr key={candidate._id}>
                  <td>
                    <div className="candidate-name">
                      <div className="candidate-avatar">
                        {(candidate.name || candidate.email || "C")
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>
                        <strong>{candidate.name || "N/A"}</strong>
                        <small>ID: {candidate._id}</small>
                      </div>
                    </div>
                  </td>

                  <td>{candidate.email || "N/A"}</td>

                  <td>
                    <span className="role-badge">Candidate</span>
                  </td>

                  <td>
                    {candidate.createdAt
                      ? new Date(candidate.createdAt).toLocaleDateString()
                      : "N/A"}
                  </td>

                  <td>
                    <div className="candidate-actions">
                      <button
                        className="candidate-delete"
                        title="Delete"
                        onClick={() => handleDelete(candidate._id)}
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Candidates;
