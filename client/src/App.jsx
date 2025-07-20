import React from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"

import HodLogin from "./components/HodLogin"
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
import PageNotFound from "./components/PageNotFound"

function App() {
  return (
    <Router>
      <Routes>
        {/* HoD Routes */}
        <Route path="/hod-login" element={<HodLogin />} />
        <Route path="/hod-signup" element={<HodSignup />} />
        <Route path="/hod-dashboard" element={<HodDashboard />} />
        {/* Teacher Routes */}
        <Route path="/teacher-login" element={<TeacherLogin />} />
        <Route path="/teacher-signup" element={<TeacherSignup />} />
        {/* Placeholder for Teacher Dashboard - will be created next */}
        <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
        {/* Default or Home Route */}
        <Route path="/" element={<Home />} />
        {/* <Route
          path="/add-specific-students"
          element={<AddSpecificStudents />}
        /> */}
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/student-login" element={<StudentLogin />} />
        <Route path="/student-signup" element={<StudentSignup />} />

        {/* Catch-all route for 404 Page Not Found - MUST be the last route */}
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Router>
  )
}

export default App
