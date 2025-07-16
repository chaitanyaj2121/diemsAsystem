import React, { useState, useEffect } from "react"
import { auth, db } from "../firebase/config"
import { signOut } from "firebase/auth"
import { collection, query, where, getDocs } from "firebase/firestore"
import { useNavigate } from "react-router-dom"

const StudentDashboard = () => {
  const [studentData, setStudentData] = useState(null)
  const [overallAttendance, setOverallAttendance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    const fetchStudentAndAttendanceData = async () => {
      setLoading(true)
      setError("")
      const storedStudentData = localStorage.getItem("studentData")

      if (storedStudentData) {
        const parsedData = JSON.parse(storedStudentData)
        setStudentData(parsedData)

        try {
          // Fetch all attendance records relevant to the student's department and year
          const attendanceQuery = query(
            collection(db, "attendance"),
            where("department", "==", parsedData.department),
            where("year", "==", parsedData.year)
          )
          const attendanceSnapshot = await getDocs(attendanceQuery)

          let totalAttendedSessions = 0
          let totalPossibleSessions = 0

          attendanceSnapshot.docs.forEach((doc) => {
            const record = doc.data()
            totalPossibleSessions++

            if (
              record.attendanceData &&
              record.attendanceData.some(
                (item) => item.studentId === parsedData.id && item.isPresent
              )
            ) {
              totalAttendedSessions++
            }
          })

          const calculatedOverallPercentage =
            totalPossibleSessions > 0
              ? (totalAttendedSessions / totalPossibleSessions) * 100
              : 0
          setOverallAttendance(calculatedOverallPercentage.toFixed(2))
        } catch (err) {
          console.error("Error fetching attendance data:", err)
          setError("Failed to load attendance data.")
        }
      } else {
        setError("No student data found. Please login again.")
        navigate("/student-login")
      }
      setLoading(false)
    }

    fetchStudentAndAttendanceData()
  }, [navigate])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      localStorage.removeItem("studentData")
      alert("Logout Success!!")
      navigate("/")
    } catch (err) {
      console.error("Logout error:", err)
      setError("Failed to log out.")
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good Morning"
    if (hour < 17) return "Good Afternoon"
    return "Good Evening"
  }

  const getAttendanceColor = (attendance) => {
    if (attendance >= 85) return "text-green-600"
    if (attendance >= 75) return "text-yellow-600"
    return "text-red-600"
  }

  const getAttendanceIcon = (attendance) => {
    if (attendance >= 85) return "🌟"
    if (attendance >= 75) return "📈"
    return "⚠️"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">
            Loading your dashboard...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 mr-4">
                <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
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

        {/* Main Dashboard Card */}
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

            {/* Attendance Section */}
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

        {/* Attendance Alert */}
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

        {/* No Data State */}
        {loading === false && parseFloat(overallAttendance) === 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              No Attendance Data Available
            </h3>
            <p className="text-gray-600 text-lg mb-6">
              There are no attendance records for your department and year yet.
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
