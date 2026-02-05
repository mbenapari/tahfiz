import "./App.css";

import { useState } from "react";
import { Route, Routes } from "react-router";

import reactLogo from "./assets/react.svg";
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import CreateSchool from "./pages/CreateSchool";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Dashboard } from "./pages/Dashboard";
import { Students } from "./pages/students/Students";
import { StudentProfile } from "./pages/students/StudentProfile";
import { EnrollStudent } from "./pages/students/EnrollStudent";
import { DailySession } from "./pages/sessions/DailySession";
import { Reports } from "./pages/reports/Reports";
import { Settings } from "./pages/settings/Settings";

function App() {
  const [count, setCount] = useState(0);

  return (
    <Routes>
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      
      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/schools/new" element={<CreateSchool />} />
        
        {/* Dashboard Routes */}
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="students" element={<Students />} />
          <Route path="students/:id" element={<StudentProfile />} />
          <Route path="students/enroll" element={<EnrollStudent />} />
          <Route path="sessions/daily" element={<DailySession />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
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
