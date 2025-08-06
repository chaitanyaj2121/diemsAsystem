import React, { useState, useEffect } from "react"
import { db } from "../firebase/config"
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  Timestamp,
} from "firebase/firestore"

const TakeAttendance = ({ teacherId, department, subjectsTaught }) => {
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedYear, setSelectedYear] = useState("")
  const [sessionType, setSessionType] = useState("") // "lecture" or "practical"
  const [selectedBatch, setSelectedBatch] = useState("") // For practical sessions
  const [studentsForAttendance, setStudentsForAttendance] = useState([])
  const [attendance, setAttendance] = useState({}) // { studentId: true/false }
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  // Populate subjects and years based on teacherData
  const availableSubjects = subjectsTaught || []
  const availableYears = [
    ...new Set(availableSubjects.map((subject) => subject.yearTaught)),
  ]

  // Get current subject details for practical batches
  const getCurrentSubjectDetails = () => {
    return availableSubjects.find(
      (subject) =>
        subject.subjectName === selectedSubject &&
        subject.yearTaught === selectedYear
    )
  }

  const currentSubject = getCurrentSubjectDetails()
  const hasPracticals = currentSubject?.hasPractical || false
  const practicalBatches = currentSubject?.practicalBatches || []

  useEffect(() => {
    // Reset state when subject, year, or session type changes
    setStudentsForAttendance([])
    setAttendance({})
    setMessage("")
    setError("")
    // Keep selectedBatch if sessionType is practical, otherwise reset it
    if (sessionType !== "practical") {
      setSelectedBatch("")
    }

    // DEBUG: Log dependency changes - These are kept for debugging purposes as requested previously
    console.log("--- useEffect Dependencies Changed ---")
    console.log("selectedSubject:", selectedSubject)
    console.log("selectedYear:", selectedYear)
    console.log("sessionType:", sessionType)
    console.log("selectedBatch:", selectedBatch)
    console.log("department:", department)
    console.log("currentSubject:", currentSubject)

    if (selectedSubject && selectedYear && sessionType && department) {
      if (sessionType === "lecture") {
        // For lectures, fetch all students of the year
        console.log("Fetching students for lecture...")
        fetchStudentsForAttendance(department, selectedYear)
      } else if (sessionType === "practical") {
        if (selectedBatch) {
          // Only fetch for practicals if a batch is selected
          console.log("Fetching students for practical batch:", selectedBatch)
          fetchStudentsForBatch(department, selectedYear, selectedBatch)
        } else {
          console.log(
            "Practical session selected, but no batch chosen yet. Waiting..."
          )
          setStudentsForAttendance([]) // Clear students if batch is not selected yet
          setAttendance({})
        }
      }
    }
  }, [
    selectedSubject,
    selectedYear,
    sessionType,
    selectedBatch,
    department,
    currentSubject,
  ])

  const fetchStudentsForAttendance = async (dept, year) => {
    setLoading(true)
    setError("")
    console.log(
      `[DEBUG] fetchStudentsForAttendance called: Dept=${dept}, Year=${year}`
    )
    try {
      const studentsQuery = query(
        collection(db, "students"),
        where("department", "==", dept),
        where("year", "==", year)
      )
      const studentsSnapshot = await getDocs(studentsQuery)
      let studentsData = studentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      // Sort students by rollNo in ascending numerical order
      studentsData.sort((a, b) => {
        if (a.rollNo && b.rollNo) {
          // Extract numeric part from rollNo (e.g., "AI3133" -> 3133)
          const numA = parseInt(a.rollNo.replace(/[^0-9]/g, ""), 10)
          const numB = parseInt(b.rollNo.replace(/[^0-9]/g, ""), 10)

          // Perform numeric comparison if both are valid numbers
          if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB
          }
          // Fallback to localeCompare if numeric extraction fails or is not applicable
          return a.rollNo.localeCompare(b.rollNo)
        }
        return 0 // Don't sort if rollNo is missing
      })

      setStudentsForAttendance(studentsData)
      // Initialize all students as present by default
      const initialAttendance = {}
      studentsData.forEach((student) => {
        initialAttendance[student.id] = true
      })
      setAttendance(initialAttendance)
      setMessage("")
      console.log(`[DEBUG] Found ${studentsData.length} students for lecture.`)
    } catch (err) {
      console.error("Error fetching students for attendance:", err)
      setError("Failed to load students for this subject/year.")
    } finally {
      setLoading(false)
    }
  }

  const fetchStudentsForBatch = async (dept, year, fullBatchString) => {
    setLoading(true)
    setError("")
    console.log(
      `[DEBUG] fetchStudentsForBatch called: Dept=${dept}, Year=${year}, FullBatchString=${fullBatchString}`
    )
    try {
      // Extract batch code from the selected batch string
      let batchCode = null

      // Handle different possible formats:
      // "Final Year - B3" -> "B3"
      // "3rd Year - Batch B1" -> "B1"
      // "Batch B1" -> "B1"
      // "B1" -> "B1"

      if (fullBatchString.includes(" - ")) {
        // Split by " - " and get the last part
        const parts = fullBatchString.split(" - ")
        const lastPart = parts[parts.length - 1]

        if (lastPart.startsWith("Batch ")) {
          batchCode = lastPart.replace("Batch ", "")
        } else {
          batchCode = lastPart
        }
      } else if (fullBatchString.startsWith("Batch ")) {
        batchCode = fullBatchString.replace("Batch ", "")
      } else {
        batchCode = fullBatchString
      }

      console.log(`[DEBUG] Extracted batchCode for query: "${batchCode}"`)

      // First, let's check what students exist for this department and year
      const allStudentsQuery = query(
        collection(db, "students"),
        where("department", "==", dept),
        where("year", "==", year)
      )
      const allStudentsSnapshot = await getDocs(allStudentsQuery)
      const allStudents = allStudentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      console.log(
        `[DEBUG] Total students for ${dept} - ${year}:`,
        allStudents.length
      )
      console.log(
        `[DEBUG] Available batches:`,
        [...new Set(allStudents.map((s) => s.batch))].sort()
      )

      // Now filter for the specific batch
      const studentsQuery = query(
        collection(db, "students"),
        where("department", "==", dept),
        where("year", "==", year),
        where("batch", "==", batchCode)
      )
      const studentsSnapshot = await getDocs(studentsQuery)
      let studentsData = studentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      console.log(
        `[DEBUG] Students found for batch "${batchCode}":`,
        studentsData.length
      )

      // Sort students by rollNo in ascending numerical order
      studentsData.sort((a, b) => {
        if (a.rollNo && b.rollNo) {
          // Extract numeric part from rollNo (e.g., "AI3133" -> 3133)
          const numA = parseInt(a.rollNo.replace(/[^0-9]/g, ""), 10)
          const numB = parseInt(b.rollNo.replace(/[^0-9]/g, ""), 10)

          // Perform numeric comparison if both are valid numbers
          if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB
          }
          // Fallback to localeCompare if numeric extraction fails or is not applicable
          return a.rollNo.localeCompare(b.rollNo)
        }
        return 0 // Don't sort if rollNo is missing
      })

      setStudentsForAttendance(studentsData)
      // Initialize all students as present by default
      const initialAttendance = {}
      studentsData.forEach((student) => {
        initialAttendance[student.id] = true
      })
      setAttendance(initialAttendance)
      setMessage("")

      if (studentsData.length === 0) {
        console.log(
          `[DEBUG] No students found for batch "${batchCode}". Available batches are:`,
          [...new Set(allStudents.map((s) => s.batch))].sort()
        )
        setError(
          `No students found for batch "${batchCode}". Available batches: ${[
            ...new Set(allStudents.map((s) => s.batch)),
          ]
            .sort()
            .join(", ")}`
        )
      }
    } catch (err) {
      console.error("Error fetching students for batch:", err)
      setError("Failed to load students for this batch.")
    } finally {
      setLoading(false)
    }
  }

  const handleAttendanceChange = (studentId) => {
    setAttendance((prevAttendance) => ({
      ...prevAttendance,
      [studentId]: !prevAttendance[studentId],
    }))
  }

  const handleSubjectChange = (e) => {
    const subject = e.target.value
    setSelectedSubject(subject)
    setSessionType("") // Reset session type when subject changes
    setSelectedBatch("") // Reset batch when subject changes
  }

  const handleSessionTypeChange = (e) => {
    const type = e.target.value
    setSessionType(type)
    setSelectedBatch("") // Reset batch when session type changes
  }

  const handleSubmitAttendance = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    setError("")

    if (
      !selectedSubject ||
      !selectedYear ||
      !sessionType ||
      studentsForAttendance.length === 0
    ) {
      setError(
        "Please select all required fields and ensure students are loaded."
      )
      setLoading(false)
      return
    }

    if (sessionType === "practical" && !selectedBatch) {
      setError("Please select a batch for practical session.")
      setLoading(false)
      return
    }

    try {
      // Determine the batch code to store in attendance (e.g., "B1")
      let batchCodeToStore = null
      if (sessionType === "practical" && selectedBatch) {
        // Use the same logic as in fetchStudentsForBatch
        if (selectedBatch.includes(" - ")) {
          const parts = selectedBatch.split(" - ")
          const lastPart = parts[parts.length - 1]

          if (lastPart.startsWith("Batch ")) {
            batchCodeToStore = lastPart.replace("Batch ", "")
          } else {
            batchCodeToStore = lastPart
          }
        } else if (selectedBatch.startsWith("Batch ")) {
          batchCodeToStore = selectedBatch.replace("Batch ", "")
        } else {
          batchCodeToStore = selectedBatch
        }
      }
      console.log(
        `[DEBUG] Batch code to store in attendance record: "${batchCodeToStore}"`
      )

      const attendanceRecord = {
        teacherId: teacherId,
        department: department,
        subjectName: selectedSubject,
        year: selectedYear,
        sessionType: sessionType, // "lecture" or "practical"
        batch: batchCodeToStore, // Store just batch code (e.g., "B1")
        sessionsCount: sessionType === "practical" ? 2 : 1, // Practical = 2 sessions, Lecture = 1 session
        date: Timestamp.fromDate(new Date()),
        attendanceData: Object.entries(attendance).map(
          ([studentId, isPresent]) => ({
            studentId,
            isPresent,
          })
        ),
      }

      await addDoc(collection(db, "attendance"), attendanceRecord)
      setMessage(
        `${
          sessionType === "practical" ? "Practical" : "Lecture"
        } attendance submitted successfully! ${
          sessionType === "practical"
            ? "(2 sessions recorded)"
            : "(1 session recorded)"
        }`
      )
      console.log("[DEBUG] Attendance record submitted:", attendanceRecord)

      alert("Attendance submitted successfully!")

      // Reset form after successful submission
      setTimeout(() => {
        setSelectedSubject("")
        setSelectedYear("")
        setSessionType("")
        setSelectedBatch("")
        setStudentsForAttendance([])
        setAttendance({})
        setMessage("") // Clear message after reset
      }, 100)
    } catch (err) {
      console.error("Error submitting attendance:", err)
      setError("Failed to submit attendance. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-6">
        Take Attendance
      </h3>

      <form onSubmit={handleSubmitAttendance} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Subject Select */}
          <div>
            <label
              htmlFor="subjectSelect"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Select Subject
            </label>
            <select
              id="subjectSelect"
              value={selectedSubject}
              onChange={handleSubjectChange}
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

          {/* Year Select */}
          <div>
            <label
              htmlFor="yearSelect"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Select Year
            </label>
            <select
              id="yearSelect"
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

        {/* Session Type Selection */}
        {selectedSubject && selectedYear && (
          <div>
            <label
              htmlFor="sessionTypeSelect"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Session Type
            </label>
            <select
              id="sessionTypeSelect"
              value={sessionType}
              onChange={handleSessionTypeChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">-- Select Session Type --</option>
              <option value="lecture">Lecture (1 session)</option>
              {hasPracticals && (
                <option value="practical">Practical (2 sessions)</option>
              )}
            </select>
          </div>
        )}

        {/* Batch Selection for Practicals */}
        {sessionType === "practical" && practicalBatches.length > 0 && (
          <div>
            <label
              htmlFor="batchSelect"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Select Batch
            </label>
            <select
              id="batchSelect"
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">-- Select Batch --</option>
              {practicalBatches.map((batch, index) => (
                <option key={index} value={batch}>
                  {batch}
                </option>
              ))}
            </select>
          </div>
        )}

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
            <p className="text-sm">Loading students...</p>
          </div>
        )}

        {selectedSubject &&
          selectedYear &&
          sessionType &&
          (sessionType === "lecture" ||
            (sessionType === "practical" && selectedBatch)) &&
          studentsForAttendance.length > 0 && (
            <div className="mt-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <h4 className="text-md sm:text-lg font-semibold text-blue-800 mb-2">
                  {sessionType === "practical"
                    ? "Practical Session"
                    : "Lecture Session"}{" "}
                  - {selectedSubject} ({selectedYear})
                </h4>
                <div className="text-sm text-blue-700">
                  <p>
                    <span className="font-medium">Type:</span>{" "}
                    {sessionType === "practical" ? "Practical" : "Lecture"}
                    {sessionType === "practical" && (
                      <>
                        <span className="mx-2">•</span>
                        <span className="font-medium">Batch:</span>{" "}
                        {selectedBatch}
                      </>
                    )}
                  </p>
                  <p className="mt-1">
                    <span className="font-medium">Sessions Count:</span>{" "}
                    {sessionType === "practical" ? "2 sessions" : "1 session"}
                  </p>
                </div>
              </div>

              {/* Responsive Table Container */}
              <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Roll Number
                      </th>
                      {sessionType === "practical" && (
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Batch
                        </th>
                      )}
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Present
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {studentsForAttendance.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {student.rollNo}
                        </td>
                        {sessionType === "practical" && (
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                              {student.batch}
                            </span>
                          </td>
                        )}
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <input
                            type="checkbox"
                            checked={attendance[student.id] || false}
                            onChange={() => handleAttendanceChange(student.id)}
                            className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                type="submit"
                className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || studentsForAttendance.length === 0}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </div>
                ) : (
                  `Submit ${
                    sessionType === "practical" ? "Practical" : "Lecture"
                  } Attendance ${
                    sessionType === "practical" ? "(2 sessions)" : "(1 session)"
                  }`
                )}
              </button>
            </div>
          )}

        {selectedSubject &&
          selectedYear &&
          sessionType &&
          (sessionType === "lecture" ||
            (sessionType === "practical" && selectedBatch)) &&
          studentsForAttendance.length === 0 &&
          !loading &&
          !error && (
            <div className="mt-6 p-4 text-center text-gray-500 border border-gray-200 rounded-md">
              No students found for this{" "}
              {sessionType === "practical" ? "batch" : "year"}.
            </div>
          )}
      </form>
    </div>
  )
}

export default TakeAttendance
