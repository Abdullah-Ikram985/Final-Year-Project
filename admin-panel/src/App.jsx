import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import AdminLayout from "./layouts/AdminLayout";

import Dashboard from "./pages/Dashboard";
import Recruiters from "./pages/Recruiters";
import Candidates from "./pages/Candidates";
import Jobs from "./pages/Jobs";
import Applications from "./pages/Applications";
import Login from "./pages/Login";
import "./App.css";
import "./pages/Shared.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/recruiters" element={<Recruiters />} />
          <Route path="/candidates" element={<Candidates />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/applications" element={<Applications />} />
        </Route>

        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
