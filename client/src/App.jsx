// src/App.js (Example updated setup)
import React from "react"
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom"
import HodSignup from "./components/HodSignup"
import HodLogin from "./components/HodLogin"
import HodDashboard from "./components/HodDashboard" // Make sure this path is correct

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/hod-signup" element={<HodSignup />} />
        <Route path="/hod-login" element={<HodLogin />} />
        <Route path="/hod-dashboard" element={<HodDashboard />} />

        <Route path="/" element={<Navigate to="/hod-login" replace />} />
      </Routes>
    </Router>
  )
}

export default App
