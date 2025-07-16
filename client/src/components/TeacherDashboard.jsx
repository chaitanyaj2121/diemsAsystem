// src/components/TeacherDashboard.jsx

import React, { useState, useEffect } from "react"
import { auth, db } from "../firebase/config"
import { signOut } from "firebase/auth"
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  addDoc,
} from "firebase/firestore"
import { useNavigate } from "react-router-dom"
import ManageStudents from "./ManageStudents" // Keep this import
import TakeAttendance from "./TakeAttendance" // Import the new TakeAttendance component

const TeacherDashboard = () => {
  const [teacherData, setTeacherData] = useState(null)
  const [students, setStudents] = useState([])
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    // Get teacher data from localStorage
    const storedTeacherData = localStorage.getItem("teacherData")
    if (storedTeacherData) {
      const parsedData = JSON.parse(storedTeacherData)
      setTeacherData(parsedData)
      // Fetch students only if department is available
      if (parsedData.department) {
        fetchStudents(parsedData.department)
      } else {
        setError("Teacher department not found. Please contact support.")
      }
    } else {
      setError("No teacher data found. Please login again.")
      navigate("/teacher-login")
    }
    setLoading(false)
  }, [navigate])

  const fetchStudents = async (department) => {
    try {
      const studentsQuery = query(
        collection(db, "students"),
        where("department", "==", department)
      )
      const studentsSnapshot = await getDocs(studentsQuery)
      const studentsData = studentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setStudents(studentsData)
    } catch (err) {
      console.error("Error fetching students:", err)
      setError("Failed to fetch student data.")
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      localStorage.removeItem("teacherData")
      navigate("/teacher-login")
    } catch (err) {
      console.error("Logout error:", err)
      setError("Failed to log out.")
    }
  }

  const TabButton = ({ id, label, isActive, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
        isActive
          ? "bg-blue-600 text-white"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      }`}
    >
      {label}
    </button>
  )

  const OverviewTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Students</h3>
            <p className="text-3xl font-bold text-blue-600">
              {students.length}
            </p>
          </div>
          <div className="bg-blue-100 p-3 rounded-full">
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Subjects</h3>
            <p className="text-3xl font-bold text-green-600">
              {teacherData?.subjectsTaught?.length || 0}
            </p>
          </div>
          <div className="bg-green-100 p-3 rounded-full">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Department</h3>
            <p className="text-lg font-medium text-purple-600">
              {teacherData?.department}
            </p>
          </div>
          <div className="bg-purple-100 p-3 rounded-full">
            <svg
              className="w-6 h-6 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="col-span-full bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Your Subjects
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teacherData?.subjectsTaught?.length > 0 ? (
            teacherData.subjectsTaught.map((subject, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800">
                  {subject.subjectName}
                </h4>
                <p className="text-sm text-gray-600">{subject.yearTaught}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No subjects assigned yet.</p>
          )}
        </div>
      </div>
    </div>
  )

  const StudentsTab = () => (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">
          Students in {teacherData?.department}
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Roll Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Year
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Department
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {student.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{student.rollNo}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{student.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {student.year || "N/A"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {student.department}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      student.userId
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {student.userId ? "Active" : "Pending"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {students.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No students found in your department.
          </div>
        )}
      </div>
    </div>
  )

  // New ManageStudentsTab component that renders the ManageStudents component
  const ManageStudentsTab = () => {
    // Refresh the students list when students are added/deleted
    const handleStudentUpdate = () => {
      if (teacherData?.department) {
        fetchStudents(teacherData.department)
      }
    }

    return (
      <div>
        <ManageStudents
          departmentId={teacherData?.department}
          onStudentUpdate={handleStudentUpdate}
        />
      </div>
    )
  }

  const SubjectsTab = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Your Teaching Subjects
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teacherData?.subjectsTaught?.length > 0 ? (
            teacherData.subjectsTaught.map((subject, index) => (
              <div
                key={index}
                className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200"
              >
                <h4 className="font-semibold text-blue-800 mb-2">
                  {subject.subjectName}
                </h4>
                <p className="text-sm text-blue-600">{subject.yearTaught}</p>
                <div className="mt-3 flex space-x-2">
                  <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">
                    View Details
                  </button>
                  <button className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700">
                    Edit
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No subjects assigned yet.</p>
          )}
        </div>
      </div>
    </div>
  )

  const ProfileTab = () => (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">
        Profile Information
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name
          </label>
          <input
            type="text"
            value={teacherData?.name || ""}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            disabled
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            value={teacherData?.email || ""}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            disabled
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Department
          </label>
          <input
            type="text"
            value={teacherData?.department || ""}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            disabled
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Role
          </label>
          <input
            type="text"
            value={teacherData?.role || ""}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            disabled
          />
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate("/teacher-login")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-800">
                  Teacher Dashboard
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {teacherData?.name}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="flex space-x-2 bg-white p-2 rounded-lg shadow-sm border border-gray-200">
            <TabButton
              id="overview"
              label="Overview"
              isActive={activeTab === "overview"}
              onClick={setActiveTab}
            />
            <TabButton
              id="students"
              label="View Students"
              isActive={activeTab === "students"}
              onClick={setActiveTab}
            />
            <TabButton
              id="manage-students"
              label="Manage Students"
              isActive={activeTab === "manage-students"}
              onClick={setActiveTab}
            />
            <TabButton
              id="take-attendance" // New Tab for Attendance
              label="Take Attendance"
              isActive={activeTab === "take-attendance"}
              onClick={setActiveTab}
            />
            <TabButton
              id="subjects"
              label="Subjects"
              isActive={activeTab === "subjects"}
              onClick={setActiveTab}
            />
            <TabButton
              id="profile"
              label="Profile"
              isActive={activeTab === "profile"}
              onClick={setActiveTab}
            />
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === "overview" && <OverviewTab />}
          {activeTab === "students" && <StudentsTab />}
          {activeTab === "manage-students" && <ManageStudentsTab />}
          {activeTab === "take-attendance" && (
            <TakeAttendance
              teacherId={teacherData?.id}
              department={teacherData?.department}
              subjectsTaught={teacherData?.subjectsTaught}
            />
          )}
          {activeTab === "subjects" && <SubjectsTab />}
          {activeTab === "profile" && <ProfileTab />}
        </div>
      </div>
    </div>
  )
}

export default TeacherDashboard
