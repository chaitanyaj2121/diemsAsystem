import React, { useState, useEffect, useMemo } from "react"
// Import auth and db directly from your firebase config file
import { auth, db } from "../firebase/config"
import { signOut } from "firebase/auth"
import { collection, query, where, getDocs } from "firebase/firestore"
import { useNavigate } from "react-router-dom"
import {
  Loader, // Used for loading indicator
} from "lucide-react" // Lucide-react for icons

const StudentDashboard = () => {
  // State variables for student data, attendance, loading, and errors
  const [studentData, setStudentData] = useState(null)
  const [overallAttendance, setOverallAttendance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [attendanceRecords, setAttendanceRecords] = useState([]) // Stores all relevant attendance records for the student's year/department
  const navigate = useNavigate() // Hook for navigation

  // Effect hook to fetch student data and relevant attendance records
  useEffect(() => {
    const fetchStudentAndAttendanceData = async () => {
      setLoading(true)
      setError("")
      // Retrieve student data from local storage
      const storedStudentData = localStorage.getItem("studentData")

      if (storedStudentData) {
        const parsedData = JSON.parse(storedStudentData)
        setStudentData(parsedData) // Set student data to state

        try {
          // Construct a query to fetch attendance records relevant to the student's department and year
          let attendanceQueryRef = collection(db, "attendance")
          let attendanceWhereClauses = [
            where("department", "==", parsedData.department),
            where("year", "==", parsedData.year),
          ]

          // Execute the query and get the attendance snapshot
          const attendanceSnapshot = await getDocs(
            query(attendanceQueryRef, ...attendanceWhereClauses)
          )
          // Map document data to an array of attendance records
          const fetchedAttendance = attendanceSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          setAttendanceRecords(fetchedAttendance) // Store fetched attendance records in state
        } catch (err) {
          // console.error("Error fetching attendance data:", err)
          setError("Failed to load attendance data.")
        } finally {
          setLoading(false) // Set loading to false regardless of success or failure
        }
      } else {
        // If no student data in local storage, show error and navigate to login
        setError("No student data found. Please login again.")
        setLoading(false)
        navigate("/student-login")
      }
    }

    // Trigger data fetching when student data is potentially available
    fetchStudentAndAttendanceData()
  }, [navigate]) // Dependencies ensure re-run when these values change

  // Memoized calculation for comprehensive attendance statistics for the current student
  const studentAttendanceStats = useMemo(() => {
    // Return default empty stats if student data or attendance records are not available
    if (!studentData || attendanceRecords.length === 0) {
      return { overall: { attended: 0, total: 0, percentage: 0 }, subjects: {} }
    }

    // Initialize stats structure
    const stats = {
      overall: { attended: 0, total: 0, percentage: 0 },
      subjects: {}, // Stores subject-wise attendance: subjectName: { lecture: {total, attended}, practical: {total, attended}, totalSessions, attendedSessions, percentage }
    }

    const uniqueSubjects = new Set() // To collect all unique subjects from fetched records

    // First pass: Identify all unique subjects relevant to the student's year/department
    attendanceRecords.forEach((record) => {
      if (record.subjectName) {
        uniqueSubjects.add(record.subjectName)
      }
    })

    // Initialize subject-wise stats for all identified unique subjects
    Array.from(uniqueSubjects).forEach((subjectName) => {
      stats.subjects[subjectName] = {
        lecture: { total: 0, attended: 0 },
        practical: { total: 0, attended: 0 },
        totalSessions: 0,
        attendedSessions: 0,
        percentage: 0,
      }
    })

    // Second pass: Process each attendance record to calculate stats
    attendanceRecords.forEach((record) => {
      const {
        subjectName,
        sessionType,
        attendanceData,
        batch: recordBatch,
        sessionsCount = sessionType === "practical" ? 2 : 1, // Default sessions count
      } = record

      // Skip if subject name is missing or not initialized in stats
      if (!subjectName || !stats.subjects[subjectName]) {
        return
      }

      const studentActualBatch = studentData.batch || "N/A" // Get the student's actual batch
      const currentRecordBatch = recordBatch || "N/A" // Get the record's batch, default to "N/A"

      // Determine if this attendance record applies to the current student
      // Lectures apply to all students in the department/year.
      // Practicals apply only if the record's batch matches the student's batch.
      const appliesToStudent =
        sessionType === "lecture" || currentRecordBatch === studentActualBatch

      if (appliesToStudent) {
        // Check if the current student was present in this specific record
        const isStudentPresentInRecord = attendanceData.some(
          (item) => item.studentId === studentData.id && item.isPresent
        )

        // Update subject-wise statistics
        const subjectStats = stats.subjects[subjectName]
        subjectStats.totalSessions += sessionsCount
        subjectStats[sessionType].total += sessionsCount
        if (isStudentPresentInRecord) {
          subjectStats.attendedSessions += sessionsCount
          subjectStats[sessionType].attended += sessionsCount
        }

        // Update overall statistics
        stats.overall.total += sessionsCount
        if (isStudentPresentInRecord) {
          stats.overall.attended += sessionsCount
        }
      }
    })

    // Calculate percentages after processing all records
    stats.overall.percentage =
      stats.overall.total > 0
        ? ((stats.overall.attended / stats.overall.total) * 100).toFixed(2)
        : 0

    for (const subjectName in stats.subjects) {
      const subjectStats = stats.subjects[subjectName]
      subjectStats.percentage =
        subjectStats.totalSessions > 0
          ? (
              (subjectStats.attendedSessions / subjectStats.totalSessions) *
              100
            ).toFixed(2)
          : 0
    }

    // Update the overallAttendance state for display in the main card
    setOverallAttendance(stats.overall.percentage)

    return stats
  }, [studentData, attendanceRecords]) // Re-run memoization if studentData or attendanceRecords change

  // Handler for user logout
  const handleLogout = async () => {
    try {
      await signOut(auth) // Sign out from Firebase
      localStorage.removeItem("studentData") // Clear student data from local storage
      // Instead of alert(), log to console or use a custom UI message
      // console.log("Logout Success!!")
      navigate("/") // Navigate to the home page or login page
    } catch (err) {
      // console.error("Logout error:", err)
      setError("Failed to log out.") // Set error message if logout fails
    }
  }

  // Helper function to get a time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good Morning"
    if (hour < 17) return "Good Afternoon"
    return "Good Evening"
  }

  // Helper function to get Tailwind CSS class based on attendance percentage
  const getAttendanceColorClass = (percentage) => {
    if (percentage >= 85) return "text-green-600 bg-green-50"
    if (percentage >= 75) return "text-yellow-600 bg-yellow-50"
    return "text-red-600 bg-red-50"
  }

  // Helper function to get an emoji icon based on attendance percentage
  const getAttendanceIcon = (attendance) => {
    if (attendance >= 85) return "🌟"
    if (attendance >= 75) return "📈"
    return "⚠️"
  }

  // Display loading spinner while data is being fetched
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center font-inter">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">
            Loading your dashboard...
          </p>
        </div>
      </div>
    )
  }

  // Display error message if an error occurs
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center font-inter">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg">
          <div className="text-red-500 text-6xl mb-4">😞</div>
          <p className="text-red-600 mb-6 text-lg font-medium">{error}</p>
          <button
            onClick={() => navigate("/student-login")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  // Main dashboard JSX
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 font-inter">
      {/* Header Section */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 mr-4">
                <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  {/* Icon for Student Portal */}
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
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
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Student Portal
              </h1>
            </div>
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 text-sm bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <svg
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-gray-800 mb-2">
            {getGreeting()}, {studentData?.name}! 👋
          </h2>
          <p className="text-lg text-gray-600">
            Welcome back to your student dashboard. Here's your attendance
            overview.
          </p>
        </div>

        {/* Main Dashboard Card: Student Info & Overall Attendance */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-8 mb-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Student Info Section */}
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">👨‍🎓</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {studentData?.name}
                    </h3>
                    <p className="text-gray-600">Student Dashboard</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">🏫</span>
                      <div>
                        <p className="text-sm text-gray-600 font-medium">
                          Department
                        </p>
                        <p className="text-lg font-bold text-gray-900">
                          {studentData?.department}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">📚</span>
                      <div>
                        <p className="text-sm text-gray-600 font-medium">
                          Academic Year
                        </p>
                        <p className="text-lg font-bold text-gray-900">
                          {studentData?.year}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">🎫</span>
                      <div>
                        <p className="text-sm text-gray-600 font-medium">
                          PRN Number
                        </p>
                        <p className="text-lg font-bold text-gray-900">
                          {studentData?.rollNo}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Overall Attendance Section */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
                <div className="text-6xl mb-4">
                  {getAttendanceIcon(parseFloat(overallAttendance))}
                </div>
                <div className="text-5xl font-bold mb-2">
                  {overallAttendance}%
                </div>
                <p className="text-blue-100 text-lg font-medium mb-4">
                  Overall Attendance
                </p>

                <div className="mt-4">
                  {parseFloat(overallAttendance) >= 85 ? (
                    <div className="bg-green-500/20 border border-green-400 rounded-lg p-3">
                      <span className="text-green-100 font-medium">
                        🌟 Excellent Performance!
                      </span>
                    </div>
                  ) : parseFloat(overallAttendance) >= 75 ? (
                    <div className="bg-yellow-500/20 border border-yellow-400 rounded-lg p-3">
                      <span className="text-yellow-100 font-medium">
                        ✅ Good Standing
                      </span>
                    </div>
                  ) : (
                    <div className="bg-red-500/20 border border-red-400 rounded-lg p-3">
                      <span className="text-red-100 font-medium">
                        ⚠️ Needs Improvement
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Alert (if overall attendance is below 75%) */}
        {parseFloat(overallAttendance) < 75 && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500 rounded-lg p-6 mb-8 shadow-lg">
            <div className="flex items-start space-x-4">
              <div className="text-3xl">🚨</div>
              <div>
                <h3 className="text-lg font-bold text-red-800 mb-2">
                  Attendance Alert - Action Required!
                </h3>
                <p className="text-red-700 mb-3">
                  Your overall attendance is{" "}
                  <strong>{overallAttendance}%</strong>, which is below the
                  required 75% minimum.
                </p>
                <div className="bg-red-100 rounded-lg p-3">
                  <p className="text-sm text-red-800 font-medium">
                    ⚠️ Important: Attendance below 75% may result in academic
                    consequences including exam debarment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Subject-wise Attendance Table */}
        {Object.keys(studentAttendanceStats.subjects).length > 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-8 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Subject-wise Attendance Details
            </h3>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Subject Name
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Lectures (Attended/Total)
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Practicals (Attended/Total)
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Total Sessions (Attended/Total)
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Percentage
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(studentAttendanceStats.subjects).map(
                    ([subjectName, stats]) => (
                      <tr key={subjectName}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {subjectName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">
                          <span className="font-semibold">
                            {stats.lecture.attended}
                          </span>{" "}
                          / {stats.lecture.total}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">
                          <span className="font-semibold">
                            {stats.practical.attended}
                          </span>{" "}
                          / {stats.practical.total}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">
                          <span className="font-semibold">
                            {stats.attendedSessions}
                          </span>{" "}
                          / {stats.totalSessions}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getAttendanceColorClass(
                              parseFloat(stats.percentage)
                            )}`}
                          >
                            {stats.percentage}%
                          </span>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          // No Data State for Subject-wise attendance
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              No Subject-wise Attendance Data Available
            </h3>
            <p className="text-gray-600 text-lg mb-6">
              Attendance records for your subjects will appear here as they are
              marked.
            </p>
          </div>
        )}

        {/* No Overall Data State (if overallAttendance is 0 and no subject data) */}
        {loading === false &&
          parseFloat(overallAttendance) === 0 &&
          Object.keys(studentAttendanceStats.subjects).length === 0 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-12 text-center">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                No Overall Attendance Data Available
              </h3>
              <p className="text-gray-600 text-lg mb-6">
                There are no attendance records for your department and year
                yet.
              </p>
              <div className="bg-blue-50 rounded-xl p-4 inline-block">
                <p className="text-blue-800 font-medium">
                  Don't worry! Attendance data will appear here once classes
                  begin.
                </p>
              </div>
            </div>
          )}
      </div>
    </div>
  )
}

export default StudentDashboard
