import "./App.css";

import { useState } from "react";
import { Route, Routes } from "react-router";

import reactLogo from "./assets/react.svg";
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import OwnerLogin from "./pages/auth/OwnerLogin";
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import OwnerLayout from "./layouts/OwnerLayout";
import ManageSchools from "./pages/owner/ManageSchools";
import ManageUsers from "./pages/owner/ManageUsers";
import ManageOwners from "./pages/owner/ManageOwners";
import ManageFeedbacks from "./pages/owner/ManageFeedbacks";
import CreateSchool from "./pages/CreateSchool";
import Home from "./pages/Home";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Dashboard } from "./pages/Dashboard";
import { Navigate } from "react-router";
import { Students } from "./pages/students/Students";
import { StudentProfile } from "./pages/students/StudentProfile";
import { EnrollStudent } from "./pages/students/EnrollStudent";
import { Instructors } from "./pages/instructors/Instructors";
import { DailySession } from "./pages/sessions/DailySession";
import { Reports } from "./pages/reports/Reports";
import { Settings } from "./pages/settings/Settings";
import { Profile } from "./pages/profile/Profile";
import { Feedback } from "./pages/Feedback";

function App() {
  const [count, setCount] = useState(0);

  return (
    <Routes>
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/owner/login" element={<OwnerLogin />} />
      <Route path="/" element={<Home />} />
      <Route path="/landing" element={<Navigate to="/" replace />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<Terms />} />
      
      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/schools/new" element={<CreateSchool />} />
        
        {/* Dashboard Routes */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/students" element={<Students />} />
          <Route path="/students/:id" element={<StudentProfile />} />
          <Route path="/students/enrollment" element={<EnrollStudent />} />
          <Route path="/instructors" element={<Instructors />} />
          <Route path="/sessions/daily/:studentId" element={<DailySession />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        {/* Owner-specific layout (replaces normal sidebar) */}
        <Route path="/owner" element={<OwnerLayout />}>
          <Route index element={<OwnerDashboard />} />
          <Route path="manage/schools" element={<ManageSchools />} />
          <Route path="manage/users" element={<ManageUsers />} />
          <Route path="manage/owners" element={<ManageOwners />} />
          <Route path="manage/feedbacks" element={<ManageFeedbacks />} />
        </Route>
      </Route>

      <Route
        path="/demo"
        element={
          <div className="App">
            <div>
              <a href="https://vitejs.dev" target="_blank">
                <img src="/vite.svg" className="logo" alt="Vite logo" />
              </a>
              <a href="https://reactjs.org" target="_blank">
                <img src={reactLogo} className="logo react" alt="React logo" />
              </a>
            </div>
            <h1>Vite + React</h1>
            <div className="card">
              <button onClick={() => setCount((count) => count + 1)}>
                count is {count}
              </button>
              <p>
                Edit <code>src/App.tsx</code> and save to test HMR
              </p>
            </div>
            <p className="read-the-docs">
              Click on the Vite and React logos to learn more
            </p>
          </div>
        }
      />
    </Routes>
  );
}

export default App;
