// src/components/AttendanceReportGenerator.jsx

import React, { useState, useEffect } from "react"
import { db } from "../firebase/config"
import { collection, query, where, getDocs } from "firebase/firestore"

const AttendanceReportGenerator = ({
  teacherId,
  department,
  subjectsTaught,
}) => {
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedYear, setSelectedYear] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [studentsMap, setStudentsMap] = useState({}) // { studentId: { name, rollNo } }

  // Extract unique subjects and years from subjectsTaught prop
  const availableSubjects = subjectsTaught || []
  const availableYears = [
    ...new Set(availableSubjects.map((subject) => subject.yearTaught)),
  ].sort() // Sort years for consistent display

  // Effect to fetch students and attendance data when selections change
  useEffect(() => {
    setAttendanceRecords([])
    setStudentsMap({})
    setError("")
    setMessage("")

    if (selectedSubject && selectedYear && department) {
      fetchDataForReport(selectedSubject, selectedYear, department)
    }
  }, [selectedSubject, selectedYear, department])

  const fetchDataForReport = async (subject, year, dept) => {
    setLoading(true)
    setError("")
    setMessage("")
    try {
      // 1. Fetch Students for the selected year and department
      const studentsQuery = query(
        collection(db, "students"),
        where("department", "==", dept),
        where("year", "==", year)
      )
      const studentsSnapshot = await getDocs(studentsQuery)
      const fetchedStudents = studentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      const tempStudentsMap = {}
      fetchedStudents.forEach((student) => {
        tempStudentsMap[student.id] = {
          name: student.name,
          rollNo: student.rollNo,
        }
      })
      setStudentsMap(tempStudentsMap)

      if (fetchedStudents.length === 0) {
        setMessage("No students found for this year and department.")
        setLoading(false)
        return
      }

      // 2. Fetch Attendance Records for the selected subject, year, and department
      const attendanceQuery = query(
        collection(db, "attendance"),
        where("teacherId", "==", teacherId), // Ensure only teacher's own records
        where("subjectName", "==", subject),
        where("year", "==", year),
        where("department", "==", dept)
        // orderBy("date", "asc") // You might want to order by date, but be aware of Firestore index requirements
      )
      const attendanceSnapshot = await getDocs(attendanceQuery)
      const fetchedAttendance = attendanceSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setAttendanceRecords(fetchedAttendance)

      if (fetchedAttendance.length === 0) {
        setMessage("No attendance records found for this subject and year.")
      } else {
        setMessage("Data loaded. Click 'Download CSV' to generate the report.")
      }
    } catch (err) {
      // console.error("Error fetching data for report:", err)
      setError("Failed to load attendance data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const generateCSV = () => {
    if (
      attendanceRecords.length === 0 ||
      Object.keys(studentsMap).length === 0
    ) {
      setError("No data available to generate CSV.")
      return
    }

    // Create CSV header
    // Header includes Roll Number, Student Name, and then dates of attendance
    const dates = [
      ...new Set(
        attendanceRecords.map((record) => {
          // Convert Firestore Timestamp to a readable date string (e.g., YYYY-MM-DD)
          return record.date.toDate().toISOString().split("T")[0]
        })
      ),
    ].sort() // Sort dates chronologically

    let csvHeader = "Roll Number,Student Name"
    dates.forEach((date) => {
      csvHeader += `,${date}`
    })
    csvHeader += "\n"

    // Create CSV rows
    let csvRows = ""
    Object.keys(studentsMap).forEach((studentId) => {
      const student = studentsMap[studentId]
      let row = `${student.rollNo || "N/A"},"${student.name || "N/A"}"` // Wrap name in quotes for commas

      dates.forEach((date) => {
        // Find the attendance record for this date and student
        const recordForDate = attendanceRecords.find(
          (record) => record.date.toDate().toISOString().split("T")[0] === date
        )

        let status = "Absent" // Default to Absent if no record or marked absent
        if (recordForDate) {
          const studentAttendance = recordForDate.attendanceData.find(
            (item) => item.studentId === studentId
          )
          if (studentAttendance && studentAttendance.isPresent) {
            status = "Present"
          }
        }
        row += `,${status}`
      })
      csvRows += row + "\n"
    })

    return csvHeader + csvRows
  }

  const downloadCSV = () => {
    const csvContent = generateCSV()
    if (!csvContent) return

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute(
        "download",
        `attendance_report_${selectedSubject}_${selectedYear}.csv`
      )
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setMessage("CSV report downloaded successfully!")
    } else {
      setError("Your browser does not support downloading files directly.")
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">
        Generate Attendance Report
      </h3>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="subjectSelectReport"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Select Subject
            </label>
            <select
              id="subjectSelectReport"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">-- Select Subject --</option>
              {availableSubjects.map((subject, index) => (
                <option key={index} value={subject.subjectName}>
                  {subject.subjectName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="yearSelectReport"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Select Year
            </label>
            <select
              id="yearSelectReport"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">-- Select Year --</option>
              {availableYears.map((year, index) => (
                <option key={index} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm">
            {message}
          </div>
        )}

        {loading && (
          <div className="text-center text-blue-600">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            Loading data...
          </div>
        )}

        <button
          onClick={downloadCSV}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={
            loading ||
            attendanceRecords.length === 0 ||
            Object.keys(studentsMap).length === 0
          }
        >
          Download Attendance CSV
        </button>

        {!selectedSubject || !selectedYear ? (
          <div className="mt-6 p-4 text-center text-gray-500 border border-gray-200 rounded-md">
            Please select a subject and year to generate a report.
          </div>
        ) : (
          !loading &&
          attendanceRecords.length === 0 &&
          Object.keys(studentsMap).length > 0 && (
            <div className="mt-6 p-4 text-center text-gray-500 border border-gray-200 rounded-md">
              No attendance records found for the selected subject and year.
            </div>
          )
        )}
        {!loading &&
          selectedSubject &&
          selectedYear &&
          Object.keys(studentsMap).length === 0 && (
            <div className="mt-6 p-4 text-center text-gray-500 border border-gray-200 rounded-md">
              No students found for the selected year and department.
            </div>
          )}
      </div>
    </div>
  )
}

export default AttendanceReportGenerator
