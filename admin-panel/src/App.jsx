import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AdminLayout from "./layouts/AdminLayout";

import Dashboard from "./pages/Dashboard";
import Recruiters from "./pages/Recruiters";
import Candidates from "./pages/Candidates";
import Jobs from "./pages/Jobs";
import JobApprovals from "./pages/JobApprovals";
import Applications from "./pages/Applications";
import Login from "./pages/Login";
import "./App.css";
import "./pages/Shared.css";

const RequireAuth = ({ children }) => {
  const token = localStorage.getItem("adminToken");
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/job-approvals" element={<JobApprovals />} />
          <Route path="/recruiters" element={<Recruiters />} />
          <Route path="/candidates" element={<Candidates />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/applications" element={<Applications />} />
        </Route>

        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
