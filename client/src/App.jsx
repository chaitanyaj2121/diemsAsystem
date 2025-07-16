// src/App.js (or your main routing file)

import React from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"

// Import your components
import HodLogin from "./components/HodLogin" // Assuming you have this
import HodSignup from "./components/HodSignup"
import HodDashboard from "./components/HodDashboard"
import TeacherLogin from "./components/TeacherLogin"
import TeacherSignup from "./components/TeacherSignup"
import TeacherDashboard from "./components/TeacherDashboard"
import AddSpecificStudents from "./components/AddSpecificStudents"
import StudentLogin from "./components/StudentLogin"
import StudentSignup from "./components/StudentSignup"
import StudentDashboard from "./components/StudentDashboard"
import Home from "./components/home"
function App() {
  return (
    <Router>
      <Routes>
        {/* HoD Routes */}
        <Route path="/hod-login" element={<HodLogin />} />
        {/* <Route path="/hod-signup" element={<HodSignup />} /> */}
        <Route path="/hod-dashboard" element={<HodDashboard />} />
        {/* Teacher Routes */}
        <Route path="/teacher-login" element={<TeacherLogin />} />{" "}
        {/* <--- NEW */}
        <Route path="/teacher-signup" element={<TeacherSignup />} />{" "}
        {/* <--- NEW */}
        {/* Placeholder for Teacher Dashboard - will be created next */}
        <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
        {/* Default or Home Route */}
        <Route path="/" element={<Home />} />{" "}
        <Route
          path="/add-specific-students"
          element={<AddSpecificStudents />}
        />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/student-login" element={<StudentLogin />} />
        <Route path="/student-signup" element={<StudentSignup />} />
        {/* Create a simple Home component if you don't have one */}
      </Routes>
    </Router>
  )
}

export default App
