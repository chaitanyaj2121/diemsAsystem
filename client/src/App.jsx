// src/App.js (or your main routing file)

import React from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"

// Import your components
import HodLogin from "./components/HodLogin" // Assuming you have this
import HodDashboard from "./components/HodDashboard"
import TeacherLogin from "./components/TeacherLogin"
import TeacherSignup from "./components/TeacherSignup"
import TeacherDashboard from "./components/TeacherDashboard"
import AddSpecificStudents from "./components/AddSpecificStudents"
import StudentLogin from "./components/StudentLogin"
import StudentSignup from "./components/StudentSignup"
import StudentDashboard from "./components/StudentDashboard"
function App() {
  return (
    <Router>
      <Routes>
        {/* HoD Routes */}
        <Route path="/hod-login" element={<HodLogin />} />
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

// Simple Home Component (Optional, create if not already existing)
function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-gray-800">
      <h1 className="text-4xl font-bold mb-6">Welcome to the College Portal</h1>
      <div className="flex space-x-4">
        <Link
          to="/hod-login"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 shadow-md"
        >
          HoD Login
        </Link>
        <Link
          to="/teacher-login"
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 shadow-md"
        >
          Teacher Login
        </Link>
        {/* Add more links as needed */}
      </div>
    </div>
  )
}

export default App
