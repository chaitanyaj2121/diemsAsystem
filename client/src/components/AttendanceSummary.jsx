// src/components/AttendanceSummary.jsx

import React, { useState, useEffect, useMemo } from "react"
import { db } from "../firebase/config"
import { collection, query, where, getDocs } from "firebase/firestore"

const AttendanceSummary = ({ teacherId, year, department, subjectsTaught }) => {
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedYear, setSelectedYear] = useState(year || "All Years") // Initialize with prop.year or "All Years"
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
      console.log(
        "Fetching data for department:",
        department,
        "and initial year filter:",
        selectedYear
      )
      try {
        // Fetch all students in the teacher's department
        const studentsQuery = query(
          collection(db, "students"),
          where("department", "==", department)
        )
        const studentsSnapshot = await getDocs(studentsQuery)
        const fetchedStudents = studentsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setAllStudents(fetchedStudents)
        console.log("Fetched Students:", fetchedStudents)

        let attendanceQuery
        if (selectedYear && selectedYear !== "All Years") {
          // If a specific year is selected, filter attendance records by department and that year
          attendanceQuery = query(
            collection(db, "attendance"),
            where("department", "==", department),
            where("year", "==", selectedYear) // Filter by the selected year
          )
          console.log(
            `Fetching attendance for department: ${department} and year: ${selectedYear}`
          )
        } else {
          // If "All Years" is selected, fetch all attendance records for the department
          attendanceQuery = query(
            collection(db, "attendance"),
            where("department", "==", department)
          )
          console.log(
            `Fetching attendance for department: ${department} (All Years)`
          )
        }

        const attendanceSnapshot = await getDocs(attendanceQuery)
        const fetchedAttendance = attendanceSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setAllAttendanceRecords(fetchedAttendance)
        console.log(
          "Fetched Attendance Records (filtered by department & year):",
          fetchedAttendance
        )

        setMessage("Data loaded. Select filters to view summary.")
      } catch (err) {
        console.error("Error fetching all data for attendance summary:", err)
        setError(
          "Failed to load attendance data. Please check console for details."
        )
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
  }, [department, selectedYear])

  const attendanceSummary = useMemo(() => {
    console.log("--- Recalculating Attendance Summary ---")
    console.log("Current selectedYear:", selectedYear)
    console.log("Number of allStudents:", allStudents.length)
    console.log("Number of allAttendanceRecords:", allAttendanceRecords.length)

    if (!allStudents.length || !allAttendanceRecords.length) {
      if (!allStudents.length) console.log("No students available.")
      if (!allAttendanceRecords.length)
        console.log("No attendance records available.")
      return []
    }

    const filteredStudents = allStudents.filter((student) => {
      const match =
        !selectedYear ||
        selectedYear === "All Years" ||
        student.year === selectedYear
      return match
    })
    console.log("Filtered Students for summary:", filteredStudents)

    // --- MODIFIED CALCULATION FOR totalClassesByYear START ---
    // Change: Now counts total records per year, not just unique dates
    const totalClassesByYear = {}
    allAttendanceRecords.forEach((record) => {
      if (record.year && record.date && record.date.toDate) {
        const yearKey = record.year
        // Increment the count for the year
        totalClassesByYear[yearKey] = (totalClassesByYear[yearKey] || 0) + 1
      } else {
        console.warn("Attendance record missing year or valid date:", record)
      }
    })
    console.log("Total Classes By Year (Count of Records):", totalClassesByYear)
    // --- MODIFIED CALCULATION FOR totalClassesByYear END ---

    const summary = filteredStudents
      .map((student) => {
        let totalAttendedClasses = 0 // Number of unique days student attended
        // Change: Now calculate this by counting specific attendance records where the student was present
        let totalPossibleClassesForStudentYear = 0 // Total count of class sessions for student's year

        // Calculate attended classes for the student for their specific year (across all subjects)
        // This part needs adjustment if "Attended Days" should also be "Attended Sessions"
        // If 'attendedClasses' should count unique days, keep the Set logic for it.
        // If 'attendedClasses' should count sessions, change it to a counter.

        // Assuming 'attendedClasses' should also be per session now, for consistency with 'totalClasses'
        for (const record of allAttendanceRecords) {
          if (record.year === student.year) {
            if (
              record.attendanceData &&
              record.attendanceData.some(
                (item) => item.studentId === student.id && item.isPresent
              )
            ) {
              // Count each session where the student was present
              totalAttendedClasses++
            }
          }
        }

        // Get total possible classes for the student's year (now count of records)
        totalPossibleClassesForStudentYear =
          totalClassesByYear[student.year] || 0

        const percentage =
          totalPossibleClassesForStudentYear > 0
            ? (totalAttendedClasses / totalPossibleClassesForStudentYear) * 100
            : 0

        const isDefaulter = percentage < attendanceThreshold

        return {
          id: student.id,
          name: student.name,
          rollNo: student.rollNo,
          department: student.department,
          year: student.year,
          attendedClasses: totalAttendedClasses, // This now reflects sessions, not unique days
          totalClasses: totalPossibleClassesForStudentYear, // This now reflects sessions, not unique days
          percentage: percentage.toFixed(2),
          isDefaulter: isDefaulter,
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name))

    const finalSummary = summary.filter((s) => s.totalClasses > 0)
    console.log(
      "Final Attendance Summary (filtered for totalClasses > 0):",
      finalSummary
    )
    return finalSummary
  }, [allStudents, allAttendanceRecords, selectedYear, attendanceThreshold])

  if (loading) {
    return (
      <div className="min-h-48 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading attendance data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">
        Attendance Summary & Defaulters (By Year)
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label
            htmlFor="summarySubjectSelect"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Subject Filter (Optional, for context only)
          </label>
          <select
            id="summarySubjectSelect"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Subjects</option>
            {availableSubjects.map((subject, index) => (
              <option key={index} value={subject.subjectName}>
                {subject.subjectName}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            This filter currently doesn't affect calculations.
          </p>
        </div>

        <div>
          <label
            htmlFor="summaryYearSelect"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Filter by Year
          </label>
          <select
            id="summaryYearSelect"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {yearOptions.map((yearOption, index) => (
              <option key={index} value={yearOption}>
                {yearOption === "" ? "All Years" : yearOption}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="attendanceThreshold"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Defaulter Threshold (%)
          </label>
          <input
            type="number"
            id="attendanceThreshold"
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

      {message && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-700 text-sm mb-4">
          {message}
        </div>
      )}

      {attendanceSummary.length === 0 &&
      !loading &&
      selectedYear &&
      selectedYear !== "All Years" ? (
        <div className="p-8 text-center text-gray-500 border border-gray-200 rounded-md">
          No attendance data found for the selected year.
        </div>
      ) : attendanceSummary.length === 0 && !loading ? (
        <div className="p-8 text-center text-gray-500 border border-gray-200 rounded-md">
          No attendance data available yet for any year or for the selected
          filters.
        </div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Roll No.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Year
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attended Sessions
                </th>{" "}
                {/* Changed 'Attended Days' to 'Attended Sessions' */}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Class Sessions
                </th>{" "}
                {/* Changed 'Total Class Days' to 'Total Class Sessions' */}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Percentage
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendanceSummary.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.rollNo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {student.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.year}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {student.attendedClasses}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {student.totalClasses}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${
                      student.isDefaulter ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {student.percentage}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        student.isDefaulter
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {student.isDefaulter ? "Defaulter" : "Good"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default AttendanceSummary
