// src/components/AttendanceSummary.jsx

import React, { useState, useEffect, useMemo } from "react"
import { db } from "../firebase/config"
import { collection, query, where, getDocs } from "firebase/firestore"

const AttendanceSummary = ({ teacherId, year, department, subjectsTaught }) => {
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedYear, setSelectedYear] = useState(year || "All Years") // Initialize with prop.year or "All Years"
  const [selectedBatch, setSelectedBatch] = useState("All Batches") // New state for batch filter
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
      // console.log(
      //   "Fetching data for department:",
      //   department,
      //   "selected year:",
      //   selectedYear,
      //   "selected batch:",
      //   selectedBatch, // Log selected batch
      //   "selected subject:",
      //   selectedSubject // Log selected subject
      // )
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
        // console.log(
        //   "Fetched Students (based on current filters):",
        //   fetchedStudents
        // )

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
        // IMPORTANT: Only filter by 'batch' for attendance records if a specific practical batch is selected.
        // Otherwise, we want all lecture records and all practical records (regardless of batch) for the given year/subject.
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
        // console.log(
        //   "Fetched Attendance Records (based on current filters):",
        //   fetchedAttendance
        // )

        setMessage("Data loaded. Select filters to view summary.")
      } catch (err) {
        // console.error("Error fetching all data for attendance summary:", err)
        setError("Failed to load attendance data")
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
  }, [department, selectedYear, selectedSubject, selectedBatch]) // Added selectedBatch and selectedSubject to dependencies

  const attendanceSummary = useMemo(() => {
    // console.log("--- Recalculating Attendance Summary ---")
    // console.log("Current selectedYear:", selectedYear)
    // console.log("Current selectedSubject:", selectedSubject)
    // console.log("Current selectedBatch:", selectedBatch)
    // console.log(
    //   "Number of allStudents (after fetch filters):",
    //   allStudents.length
    // )
    // console.log(
    //   "Number of allAttendanceRecords (after fetch filters):",
    //   allAttendanceRecords.length
    // )

    if (!allStudents.length) {
      // console.log("No students available after initial fetch.")
      return []
    }
    // Attendance records might be empty if no classes have been taken for the selected filters
    if (!allAttendanceRecords.length) {
      // console.log(
      //   "No attendance records found for current filters. Returning empty summary."
      // )
      // We can return students with 0/0 attendance if we want to show them
      return allStudents
        .map((student) => ({
          id: student.id,
          name: student.name,
          rollNo: student.rollNo,
          department: student.department,
          year: student.year,
          batch: student.batch || "N/A",
          attendedClasses: 0,
          totalClasses: 0,
          percentage: "0.00",
          isDefaulter: true, // If no classes, they are technically defaulters by 75% threshold
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
    }

    const studentSummaryMap = new Map()

    allStudents.forEach((student) => {
      // Initialize student's summary data
      studentSummaryMap.set(student.id, {
        ...student,
        totalAttendedSessions: 0,
        totalPossibleSessions: 0,
        // We don't need separate lecture/practical totals on the student object itself anymore,
        // we'll calculate them dynamically based on records.
      })
    })

    // Calculate total possible sessions for each *relevant* type (lecture/practical for a specific batch)
    // This map stores the total sessions conducted for a given (year, subject, sessionType, batch) combination
    const conductedSessionsMap = new Map() // Key: `year-subject-sessionType-batch`, Value: totalSessions

    allAttendanceRecords.forEach((record) => {
      const sessionsCount =
        record.sessionsCount || (record.sessionType === "practical" ? 2 : 1)
      const recordBatch = record.batch || "N/A" // Use "N/A" for lecture records that don't have a batch field

      // Construct a unique key for grouping sessions
      const key = `${record.year}-${record.subjectName}-${record.sessionType}-${recordBatch}`
      conductedSessionsMap.set(
        key,
        (conductedSessionsMap.get(key) || 0) + sessionsCount
      )

      // Update attended sessions for each student in this record
      if (record.attendanceData) {
        record.attendanceData.forEach((item) => {
          if (item.isPresent && studentSummaryMap.has(item.studentId)) {
            const student = studentSummaryMap.get(item.studentId)

            // Ensure this record matches the student's year, and if applicable, their batch for practicals
            const studentActualBatch = student.batch || "N/A"

            if (
              student.year === record.year &&
              (record.sessionType === "lecture" ||
                recordBatch === studentActualBatch)
            ) {
              student.totalAttendedSessions += sessionsCount
            }
          }
        })
      }
    })

    // Now, go through each student and assign their totalPossibleSessions
    const finalSummary = Array.from(studentSummaryMap.values())
      .map((student) => {
        let totalPossibleForStudent = 0
        const studentActualBatch = student.batch || "N/A"

        // Add lecture sessions relevant to this student's year and selected subject
        const lectureKey = `${student.year}-${
          selectedSubject || ""
        }-lecture-N/A` // Subject is optional in key if filter is 'All Subjects'
        // If 'All Subjects' is chosen, we sum up all lectures for the year.
        // If a specific subject is chosen, we only sum lectures for that subject.
        if (selectedSubject === "" || selectedSubject === "All Subjects") {
          // Iterate over all conductedSessionsMap to find all lecture sessions for this student's year
          for (const [key, sessions] of conductedSessionsMap.entries()) {
            const [year, subject, type, batch] = key.split("-")
            if (year === student.year && type === "lecture") {
              totalPossibleForStudent += sessions
            }
          }
        } else {
          // If a specific subject is selected, use its lecture count
          const specificLectureKey = `${student.year}-${selectedSubject}-lecture-N/A`
          totalPossibleForStudent +=
            conductedSessionsMap.get(specificLectureKey) || 0
        }

        // Add practical sessions for this student's specific batch (if they have one)
        // This is crucial: only count practicals for *their* batch.
        if (studentActualBatch !== "N/A") {
          if (selectedSubject === "" || selectedSubject === "All Subjects") {
            // If 'All Subjects', sum all practicals for this student's batch in their year
            for (const [key, sessions] of conductedSessionsMap.entries()) {
              const [year, subject, type, batch] = key.split("-")
              if (
                year === student.year &&
                type === "practical" &&
                batch === studentActualBatch
              ) {
                totalPossibleForStudent += sessions
              }
            }
          } else {
            // If a specific subject, sum practicals for that subject and their batch
            const practicalKey = `${student.year}-${selectedSubject}-practical-${studentActualBatch}`
            totalPossibleForStudent +=
              conductedSessionsMap.get(practicalKey) || 0
          }
        }

        const percentage =
          totalPossibleForStudent > 0
            ? (student.totalAttendedSessions / totalPossibleForStudent) * 100
            : 0

        const isDefaulter = percentage < attendanceThreshold

        return {
          id: student.id,
          name: student.name,
          rollNo: student.rollNo,
          department: student.department,
          year: student.year,
          batch: student.batch || "N/A", // Display student's batch if available
          attendedClasses: student.totalAttendedSessions,
          totalClasses: totalPossibleForStudent,
          percentage: percentage.toFixed(2),
          isDefaulter: isDefaulter,
        }
      })
      .filter((s) => s.totalClasses > 0) // Only show students who have had some classes
      .sort((a, b) => a.name.localeCompare(b.name))

    // console.log(
    //   "Final Attendance Summary (filtered for totalClasses > 0):",
    //   finalSummary
    // )
    return finalSummary
  }, [
    allStudents,
    allAttendanceRecords,
    selectedYear,
    selectedSubject,
    selectedBatch,
    attendanceThreshold,
  ]) // Added selectedSubject and selectedBatch to dependencies

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">
        Attendance Summary & Defaulters
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label
            htmlFor="summarySubjectSelect"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Filter by Subject
          </label>
          <select
            id="summarySubjectSelect"
            value={selectedSubject}
            onChange={(e) => {
              setSelectedSubject(e.target.value)
              setSelectedBatch("All Batches") // Reset batch when subject changes
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
          <label
            htmlFor="summaryYearSelect"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Filter by Year
          </label>
          <select
            id="summaryYearSelect"
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(e.target.value)
              setSelectedSubject("") // Reset subject when year changes
              setSelectedBatch("All Batches") // Reset batch when year changes
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
            <label
              htmlFor="summaryBatchSelect"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Filter by Batch
            </label>
            <select
              id="summaryBatchSelect"
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
            <p className="text-xs text-gray-500 mt-1">
              Only shows for selected Subject & Year.
            </p>
          </div>
        )}

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

      {attendanceSummary.length === 0 && !loading && (
        <div className="p-8 text-center text-gray-500 border border-gray-200 rounded-md">
          No attendance data found for the selected filters.
        </div>
      )}

      {attendanceSummary.length > 0 && (
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Batch
                </th>{" "}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attended Sessions
                </th>{" "}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Class Sessions
                </th>{" "}
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.batch}
                  </td>{" "}
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
