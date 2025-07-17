import React, { useState, useEffect, useMemo } from "react"
import {
  User,
  Calendar,
  BookOpen,
  Users,
  Download,
  Filter,
  Loader,
} from "lucide-react"
import { db } from "../firebase/config"
import { collection, query, where, getDocs } from "firebase/firestore"

const FullSubjectPracticalSummary = ({
  teacherId,
  year,
  department,
  subjectsTaught = [],
  userRole = "hod",
  currentUserId = null,
}) => {
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedYear, setSelectedYear] = useState(year || "All Years")
  const [selectedBatch, setSelectedBatch] = useState("All Batches")
  const [attendanceThreshold, setAttendanceThreshold] = useState(75)
  const [allStudents, setAllStudents] = useState([])
  const [allAttendanceRecords, setAllAttendanceRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const availableSubjects = subjectsTaught || []
  const availableYears = [
    ...new Set(availableSubjects.map((subject) => subject.yearTaught)),
  ].sort()

  const yearOptions = ["All Years", ...availableYears.filter((y) => y !== "")]

  // Derive available batches based on selected subject and year
  const availableBatches = useMemo(() => {
    if (selectedSubject && selectedYear !== "All Years") {
      const currentSubject = availableSubjects.find(
        (subject) =>
          subject.subjectName === selectedSubject &&
          subject.yearTaught === selectedYear
      )
      if (
        currentSubject &&
        currentSubject.hasPractical &&
        currentSubject.practicalBatches
      ) {
        // Extract just the batch codes (e.g., "B1", "B2") from "3rd Year - Batch B1"
        const batches = currentSubject.practicalBatches.map((batch) => {
          const parts = batch.split(" - ")
          if (parts.length === 2 && parts[1].startsWith("Batch ")) {
            return parts[1].split(" ")[1]
          }
          return batch // Fallback if format is different
        })
        return ["All Batches", ...new Set(batches)].sort()
      }
    }
    return ["All Batches"] // Default if no specific subject/year or no practicals
  }, [selectedSubject, selectedYear, availableSubjects])

  // Get unique subjects from attendance records
  const getUniqueSubjects = () => {
    const subjectSet = new Set()
    allAttendanceRecords.forEach((record) => {
      if (record.subjectName) {
        subjectSet.add(record.subjectName)
      }
    })
    return Array.from(subjectSet)
  }

  useEffect(() => {
    if (year) {
      setSelectedYear(year)
    } else {
      setSelectedYear("All Years")
    }
  }, [year])

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true)
      setError("")
      setMessage("")

      try {
        // Fetch students based on department and selected year
        let studentsQueryRef = collection(db, "students")
        let studentWhereClauses = [where("department", "==", department)]

        if (selectedYear && selectedYear !== "All Years") {
          studentWhereClauses.push(where("year", "==", selectedYear))
        }
        // If a specific batch is selected, filter students by batch as well
        if (selectedBatch && selectedBatch !== "All Batches") {
          studentWhereClauses.push(where("batch", "==", selectedBatch))
        }

        const studentsQuery = query(studentsQueryRef, ...studentWhereClauses)
        const studentsSnapshot = await getDocs(studentsQuery)
        const fetchedStudents = studentsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setAllStudents(fetchedStudents)

        // Fetch attendance records based on department, selected year, and selected subject
        let attendanceQueryRef = collection(db, "attendance")
        let attendanceWhereClauses = [where("department", "==", department)]

        if (selectedYear && selectedYear !== "All Years") {
          attendanceWhereClauses.push(where("year", "==", selectedYear))
        }
        if (selectedSubject && selectedSubject !== "All Subjects") {
          attendanceWhereClauses.push(
            where("subjectName", "==", selectedSubject)
          )
        }
        // Only filter by 'batch' for attendance records if a specific practical batch is selected
        if (selectedBatch && selectedBatch !== "All Batches") {
          attendanceWhereClauses.push(where("batch", "==", selectedBatch))
        }

        const attendanceQuery = query(
          attendanceQueryRef,
          ...attendanceWhereClauses
        )
        const attendanceSnapshot = await getDocs(attendanceQuery)
        const fetchedAttendance = attendanceSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setAllAttendanceRecords(fetchedAttendance)

        setMessage("Data loaded successfully.")
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("Failed to load attendance data. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    if (department) {
      fetchAllData()
    } else {
      setError("Department data is missing. Cannot load summary.")
      setLoading(false)
    }
  }, [department, selectedYear, selectedSubject, selectedBatch])

  // Calculate comprehensive attendance statistics
  const attendanceStats = useMemo(() => {
    const stats = {}
    const subjectList = getUniqueSubjects()

    // Initialize stats for each student
    allStudents.forEach((student) => {
      stats[student.id] = {
        student: student,
        totalSessions: 0,
        attendedSessions: 0,
        subjectWise: {},
      }

      // Initialize subject-wise stats
      subjectList.forEach((subject) => {
        stats[student.id].subjectWise[subject] = {
          lecture: { total: 0, attended: 0 },
          practical: { total: 0, attended: 0 },
          totalSessions: 0,
          attendedSessions: 0,
        }
      })
    })

    // Process attendance records
    allAttendanceRecords.forEach((record) => {
      const {
        subjectName,
        sessionType,
        attendanceData,
        department: recordDept,
        year: recordYear,
        batch: recordBatch,
        sessionsCount = sessionType === "practical" ? 2 : 1,
      } = record

      // Process each student's attendance in this record
      attendanceData?.forEach((attendance) => {
        const { studentId, isPresent } = attendance

        if (stats[studentId]) {
          const studentStats = stats[studentId]
          const subjectStats = studentStats.subjectWise[subjectName]

          if (subjectStats) {
            const studentActualBatch = studentStats.student.batch || "N/A"
            const recordActualBatch = recordBatch || "N/A"

            // Check if this record applies to this student
            if (
              studentStats.student.year === recordYear &&
              (sessionType === "lecture" ||
                recordActualBatch === studentActualBatch)
            ) {
              // Update session counts
              subjectStats.totalSessions += sessionsCount
              subjectStats[sessionType].total += sessionsCount
              studentStats.totalSessions += sessionsCount

              // Update attendance counts
              if (isPresent) {
                subjectStats.attendedSessions += sessionsCount
                subjectStats[sessionType].attended += sessionsCount
                studentStats.attendedSessions += sessionsCount
              }
            }
          }
        }
      })
    })

    return { stats, subjects: subjectList }
  }, [
    allStudents,
    allAttendanceRecords,
    selectedYear,
    selectedSubject,
    selectedBatch,
  ])

  // Calculate attendance percentage
  const getAttendancePercentage = (attended, total) => {
    if (total === 0) return 0
    return Math.round((attended / total) * 100)
  }

  // Get color class based on percentage
  const getStatusColor = (percentage) => {
    if (percentage >= 75) return "text-green-600 bg-green-50"
    if (percentage >= 60) return "text-yellow-600 bg-yellow-50"
    return "text-red-600 bg-red-50"
  }

  // Get departments from students
  const getDepartments = () => {
    const depts = new Set(allStudents.map((s) => s.department))
    return Array.from(depts)
  }

  // Filter students for display
  const getFilteredStudents = () => {
    return allStudents.filter((student) => {
      const studentStats = attendanceStats.stats[student.id]
      return studentStats && studentStats.totalSessions > 0
    })
  }

  const filteredStudents = getFilteredStudents()

  // Function to export data to CSV
  const exportToCSV = () => {
    if (filteredStudents.length === 0) {
      alert("No data to export.")
      return
    }

    const headers = [
      "Roll No.",
      "Name of Student",
      "Batch",
      ...attendanceStats.subjects.flatMap((subject) => [
        `${subject} (L Attended)`,
        `${subject} (L Total)`,
        `${subject} (P Attended)`,
        `${subject} (P Total)`,
      ]),
      "Overall Attended Sessions",
      "Overall Total Sessions",
      "Overall Attendance %",
    ]

    const rows = filteredStudents.map((student) => {
      const studentStats = attendanceStats.stats[student.id]
      const rowData = [student.rollNo, student.name, student.batch || "N/A"]

      attendanceStats.subjects.forEach((subject) => {
        const subjectStats = studentStats.subjectWise[subject]
        if (subjectStats) {
          rowData.push(subjectStats.lecture.attended)
          rowData.push(subjectStats.lecture.total)
          rowData.push(subjectStats.practical.attended)
          rowData.push(subjectStats.practical.total)
        } else {
          rowData.push("", "", "", "") // Empty for subjects not applicable
        }
      })

      rowData.push(studentStats.attendedSessions)
      rowData.push(studentStats.totalSessions)
      rowData.push(
        getAttendancePercentage(
          studentStats.attendedSessions,
          studentStats.totalSessions
        )
      )
      return rowData
    })

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", "attendance_summary.csv")
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading attendance data...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-700">{error}</div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                Full Subject-wise & Practical-wise Summary
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={exportToCSV}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Export to CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value)
                  setSelectedBatch("All Batches")
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Subjects</option>
                {availableSubjects.map((subject, index) => (
                  <option key={index} value={subject.subjectName}>
                    {subject.subjectName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value)
                  setSelectedSubject("")
                  setSelectedBatch("All Batches")
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {yearOptions.map((yearOption, index) => (
                  <option key={index} value={yearOption}>
                    {yearOption === "" ? "All Years" : yearOption}
                  </option>
                ))}
              </select>
            </div>
            {selectedSubject && selectedYear !== "All Years" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Batch
                </label>
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {availableBatches.map((batchOption, index) => (
                    <option key={index} value={batchOption}>
                      {batchOption}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Defaulter Threshold (%)
              </label>
              <input
                type="number"
                value={attendanceThreshold}
                onChange={(e) =>
                  setAttendanceThreshold(
                    Math.max(0, Math.min(100, Number(e.target.value)))
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                max="100"
              />
            </div>
          </div>
        </div>

        {message && (
          <div className="px-6 py-3 bg-blue-50 border-b border-blue-200">
            <div className="text-blue-700 text-sm">{message}</div>
          </div>
        )}

        {/* Attendance Table */}
        {filteredStudents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No attendance data found for the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-r border-gray-200">
                    Roll No.
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-r border-gray-200">
                    Name of Student
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-r border-gray-200">
                    Batch
                  </th>
                  {attendanceStats.subjects.map((subject) => (
                    <th key={subject} className="border-r border-gray-200">
                      <div className="px-2 py-2 text-center">
                        <div className="text-sm font-semibold text-gray-700 mb-1">
                          {subject}
                        </div>
                        <div className="flex justify-center space-x-1">
                          <div className="text-xs text-gray-500 bg-blue-100 px-2 py-1 rounded">
                            L
                          </div>
                          <div className="text-xs text-gray-500 bg-green-100 px-2 py-1 rounded">
                            P
                          </div>
                        </div>
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-r border-gray-200">
                    Total
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                    %
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, index) => {
                  const studentStats = attendanceStats.stats[student.id]
                  if (!studentStats) return null

                  const overallPercentage = getAttendancePercentage(
                    studentStats.attendedSessions,
                    studentStats.totalSessions
                  )

                  return (
                    <tr
                      key={student.id}
                      className={`border-b border-gray-200 hover:bg-gray-50 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 font-medium">
                        {student.rollNo}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 font-medium">
                        {student.name}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600 border-r border-gray-200">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {student.batch || "N/A"}
                        </span>
                      </td>
                      {attendanceStats.subjects.map((subject) => {
                        const subjectStats = studentStats.subjectWise[subject]
                        if (!subjectStats)
                          return (
                            <td
                              key={subject}
                              className="border-r border-gray-200"
                            ></td>
                          )

                        return (
                          <td
                            key={subject}
                            className="px-2 py-3 text-center text-sm border-r border-gray-200"
                          >
                            <div className="flex flex-col space-y-1">
                              {/* Lecture */}
                              <div className="flex items-center justify-center space-x-1">
                                <span className="text-xs text-blue-600">
                                  L:
                                </span>
                                <span className="font-medium text-gray-900">
                                  {subjectStats.lecture.attended}
                                </span>
                                <span className="text-xs text-gray-500">
                                  /{subjectStats.lecture.total}
                                </span>
                              </div>
                              {/* Practical */}
                              <div className="flex items-center justify-center space-x-1">
                                <span className="text-xs text-green-600">
                                  P:
                                </span>
                                <span className="font-medium text-gray-900">
                                  {subjectStats.practical.attended}
                                </span>
                                <span className="text-xs text-gray-500">
                                  /{subjectStats.practical.total}
                                </span>
                              </div>
                            </div>
                          </td>
                        )
                      })}
                      <td className="px-4 py-3 text-center text-sm font-medium border-r border-gray-200">
                        <div className="flex flex-col items-center">
                          <span className="text-gray-900">
                            {studentStats.attendedSessions}
                          </span>
                          <span className="text-xs text-gray-500">
                            /{studentStats.totalSessions}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            overallPercentage
                          )}`}
                        >
                          {overallPercentage}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary Statistics */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {filteredStudents.length}
              </div>
              <div className="text-sm text-gray-500">Total Students</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {
                  filteredStudents.filter((student) => {
                    const stats = attendanceStats.stats[student.id]
                    if (!stats) return false
                    const percentage = getAttendancePercentage(
                      stats.attendedSessions,
                      stats.totalSessions
                    )
                    return percentage >= attendanceThreshold
                  }).length
                }
              </div>
              <div className="text-sm text-gray-500">
                Above {attendanceThreshold}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {
                  filteredStudents.filter((student) => {
                    const stats = attendanceStats.stats[student.id]
                    if (!stats) return false
                    const percentage = getAttendancePercentage(
                      stats.attendedSessions,
                      stats.totalSessions
                    )
                    return percentage >= 60 && percentage < attendanceThreshold
                  }).length
                }
              </div>
              <div className="text-sm text-gray-500">
                60-{attendanceThreshold}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {
                  filteredStudents.filter((student) => {
                    const stats = attendanceStats.stats[student.id]
                    if (!stats) return false
                    const percentage = getAttendancePercentage(
                      stats.attendedSessions,
                      stats.totalSessions
                    )
                    return percentage < 60
                  }).length
                }
              </div>
              <div className="text-sm text-gray-500">Below 60%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FullSubjectPracticalSummary
