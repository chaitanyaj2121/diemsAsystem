import React, { useState, useEffect, useMemo } from "react"
import {
  Plus,
  Search,
  Calculator,
  Save,
  X,
  User,
  BookOpen,
  Calendar,
  AlertCircle,
  CheckCircle,
} from "lucide-react"
import { db } from "../firebase/config"
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore"

const ExtraAttendance = ({
  department,
  year = "All Years",
  teacherId,
  onClose,
}) => {
  const [students, setStudents] = useState([])
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [extraAttendanceRecords, setExtraAttendanceRecords] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [extraSessions, setExtraSessions] = useState("")
  const [reason, setReason] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("")

  // Reason options
  const reasonOptions = [
    "Health Issues",
    "Medical Leave",
    "Extracurricular Activities",
    "Sports Activities",
    "Cultural Activities",
    "Academic Competition",
    "Family Emergency",
    "Official College Work",
    "Other",
  ]

  useEffect(() => {
    fetchData()
  }, [department, year])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch students
      let studentsQuery = collection(db, "students")
      let studentWhereClauses = [where("department", "==", department)]

      if (year && year !== "All Years") {
        studentWhereClauses.push(where("year", "==", year))
      }

      const studentsQueryRef = query(studentsQuery, ...studentWhereClauses)
      const studentsSnapshot = await getDocs(studentsQueryRef)
      const fetchedStudents = studentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setStudents(fetchedStudents)

      // Fetch attendance records
      let attendanceQuery = collection(db, "attendance")
      let attendanceWhereClauses = [where("department", "==", department)]

      if (year && year !== "All Years") {
        attendanceWhereClauses.push(where("year", "==", year))
      }

      const attendanceQueryRef = query(
        attendanceQuery,
        ...attendanceWhereClauses
      )
      const attendanceSnapshot = await getDocs(attendanceQueryRef)
      const fetchedAttendance = attendanceSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setAttendanceRecords(fetchedAttendance)

      // Fetch existing extra attendance records
      let extraAttendanceQuery = collection(db, "extraAttendance")
      let extraAttendanceWhereClauses = [where("department", "==", department)]

      if (year && year !== "All Years") {
        extraAttendanceWhereClauses.push(where("year", "==", year))
      }

      const extraAttendanceQueryRef = query(
        extraAttendanceQuery,
        ...extraAttendanceWhereClauses
      )
      const extraAttendanceSnapshot = await getDocs(extraAttendanceQueryRef)
      const fetchedExtraAttendance = extraAttendanceSnapshot.docs.map(
        (doc) => ({
          id: doc.id,
          ...doc.data(),
        })
      )
      setExtraAttendanceRecords(fetchedExtraAttendance)
    } catch (error) {
      console.error("Error fetching data:", error)
      showMessage("Failed to load data", "error")
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (msg, type) => {
    setMessage(msg)
    setMessageType(type)
    setTimeout(() => {
      setMessage("")
      setMessageType("")
    }, 3000)
  }

  // Calculate current overall attendance for selected student
  const calculateCurrentAttendance = useMemo(() => {
    if (!selectedStudent) return null

    // Calculate total sessions from regular attendance
    const studentAttendance = attendanceRecords.filter((record) =>
      record.attendanceData?.some((att) => att.studentId === selectedStudent.id)
    )

    let totalSessions = 0
    let attendedSessions = 0

    studentAttendance.forEach((record) => {
      const studentAttData = record.attendanceData?.find(
        (att) => att.studentId === selectedStudent.id
      )
      if (studentAttData) {
        const sessions =
          record.sessionsCount || (record.sessionType === "practical" ? 2 : 1)
        totalSessions += sessions
        if (studentAttData.isPresent) {
          attendedSessions += sessions
        }
      }
    })

    // Add existing extra attendance for this student
    const studentExtraAttendance = extraAttendanceRecords.filter(
      (record) => record.studentId === selectedStudent.id
    )

    let totalExtraSessions = 0
    studentExtraAttendance.forEach((record) => {
      totalExtraSessions += record.extraSessions || 0
    })

    // Extra sessions are ONLY added to attended sessions, NOT to total
    // This increases the numerator without changing the denominator
    const finalTotalSessions = totalSessions // Keep original total unchanged
    const finalAttendedSessions = attendedSessions + totalExtraSessions

    return {
      totalSessions: finalTotalSessions,
      attendedSessions: finalAttendedSessions,
      regularTotalSessions: totalSessions,
      regularAttendedSessions: attendedSessions,
      existingExtraSessions: totalExtraSessions,
    }
  }, [selectedStudent, attendanceRecords, extraAttendanceRecords])

  // Calculate projected attendance with new extra sessions
  const calculateProjectedAttendance = useMemo(() => {
    if (!calculateCurrentAttendance || !extraSessions) return null

    const { totalSessions, attendedSessions } = calculateCurrentAttendance
    const extraSessionsNum = parseInt(extraSessions) || 0

    // Only add extra sessions to attended count, keep total unchanged
    const newTotalSessions = totalSessions // Keep total same
    const newAttendedSessions = Math.min(
      attendedSessions + extraSessionsNum,
      totalSessions
    ) // Cap at total to prevent >100%

    const currentPercentage =
      totalSessions > 0
        ? Math.round((attendedSessions / totalSessions) * 100)
        : 0
    const projectedPercentage =
      newTotalSessions > 0
        ? Math.round((newAttendedSessions / newTotalSessions) * 100)
        : 0

    return {
      currentPercentage,
      projectedPercentage,
      currentAttended: attendedSessions,
      currentTotal: totalSessions,
      projectedAttended: newAttendedSessions,
      projectedTotal: newTotalSessions,
      cappedAtTotal: attendedSessions + extraSessionsNum > totalSessions,
    }
  }, [calculateCurrentAttendance, extraSessions])

  // Filter students based on search term
  const filteredStudents = students.filter(
    (student) =>
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNo?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSaveExtraAttendance = async () => {
    if (!selectedStudent || !extraSessions || !reason) {
      showMessage("Please fill all required fields", "error")
      return
    }

    const extraSessionsNum = parseInt(extraSessions)
    if (extraSessionsNum <= 0 || extraSessionsNum > 100) {
      showMessage("Please enter a valid number of sessions (1-100)", "error")
      return
    }

    setSaving(true)
    try {
      // Create extra attendance record - this will be added to overall total, not subject-wise
      const extraAttendanceData = {
        studentId: selectedStudent.id,
        extraSessions: extraSessionsNum,
        reason: reason,
        department: department,
        year: selectedStudent.year,
        batch: selectedStudent.batch,
        addedBy: teacherId,
        addedAt: serverTimestamp(),
        studentName: selectedStudent.name,
        studentRollNo: selectedStudent.rollNo,
        type: "extra_attendance_total", // Changed type to indicate it's for total attendance
      }

      await addDoc(collection(db, "extraAttendance"), extraAttendanceData)

      showMessage(
        "Extra attendance added successfully to overall total!",
        "success"
      )

      // Reset form
      setSelectedStudent(null)
      setExtraSessions("")
      setReason("")
      setSearchTerm("")

      // Refresh data to show updated attendance
      fetchData()
    } catch (error) {
      console.error("Error saving extra attendance:", error)
      showMessage("Failed to save extra attendance", "error")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Plus className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              Add Extra Attendance (Overall Total)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-200">
          <div className="flex items-center space-x-2 text-blue-700">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">
              Extra sessions will be added to the student's overall attendance
              total, not to any specific subject.
            </span>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`p-4 border-b ${
              messageType === "success"
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            <div className="flex items-center space-x-2">
              {messageType === "success" ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              <span>{message}</span>
            </div>
          </div>
        )}

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Panel - Student Selection */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Students
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name or roll number..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Student
                </label>
                <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto">
                  {filteredStudents.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No students found
                    </div>
                  ) : (
                    filteredStudents.map((student) => (
                      <div
                        key={student.id}
                        onClick={() => setSelectedStudent(student)}
                        className={`p-3 cursor-pointer border-b border-gray-100 hover:bg-gray-50 ${
                          selectedStudent?.id === student.id
                            ? "bg-blue-50 border-blue-200"
                            : ""
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-900">
                              {student.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {student.rollNo} • {student.year} • Batch{" "}
                              {student.batch}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel - Attendance Details */}
            <div className="space-y-6">
              {selectedStudent && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">
                    Selected Student
                  </h3>
                  <div className="text-sm text-blue-800">
                    <div>{selectedStudent.name}</div>
                    <div>
                      {selectedStudent.rollNo} • {selectedStudent.year}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Extra Sessions *
                </label>
                <input
                  type="number"
                  value={extraSessions}
                  onChange={(e) => setExtraSessions(e.target.value)}
                  placeholder="Enter number of extra sessions"
                  min="1"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!selectedStudent}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!selectedStudent}
                >
                  <option value="">Select Reason</option>
                  {reasonOptions.map((reasonOption) => (
                    <option key={reasonOption} value={reasonOption}>
                      {reasonOption}
                    </option>
                  ))}
                </select>
              </div>

              {/* Overall Attendance Projection */}
              {calculateProjectedAttendance && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <Calculator className="h-5 w-5 text-gray-600" />
                    <h3 className="font-medium text-gray-900">
                      Overall Attendance Projection
                    </h3>
                  </div>

                  {calculateCurrentAttendance && (
                    <div className="mb-3 text-sm">
                      <div className="text-gray-600 mb-1">
                        Current Breakdown:
                      </div>
                      <div className="text-xs text-gray-500">
                        Regular Sessions:{" "}
                        {calculateCurrentAttendance.regularAttendedSessions}/
                        {calculateCurrentAttendance.regularTotalSessions}
                        {calculateCurrentAttendance.existingExtraSessions >
                          0 && (
                          <span className="ml-2 text-orange-600">
                            + {calculateCurrentAttendance.existingExtraSessions}{" "}
                            extra added to attended
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600 mb-1">Current Overall</div>
                      <div className="font-medium">
                        {calculateProjectedAttendance.currentAttended}/
                        {calculateProjectedAttendance.currentTotal}
                        <span
                          className={`ml-2 px-2 py-1 rounded text-xs ${
                            calculateProjectedAttendance.currentPercentage >= 75
                              ? "bg-green-100 text-green-800"
                              : calculateProjectedAttendance.currentPercentage >=
                                60
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {calculateProjectedAttendance.currentPercentage}%
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="text-gray-600 mb-1">
                        After Adding to Attended
                      </div>
                      <div className="font-medium">
                        {calculateProjectedAttendance.projectedAttended}/
                        {calculateProjectedAttendance.projectedTotal}
                        <span
                          className={`ml-2 px-2 py-1 rounded text-xs ${
                            calculateProjectedAttendance.projectedPercentage >=
                            75
                              ? "bg-green-100 text-green-800"
                              : calculateProjectedAttendance.projectedPercentage >=
                                60
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {calculateProjectedAttendance.projectedPercentage}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {calculateProjectedAttendance.cappedAtTotal && (
                    <div className="mt-3 text-sm text-amber-600 bg-amber-50 p-2 rounded">
                      ⚠ Attendance capped at 100% (cannot exceed total sessions)
                    </div>
                  )}

                  {calculateProjectedAttendance.projectedPercentage >
                    calculateProjectedAttendance.currentPercentage &&
                    !calculateProjectedAttendance.cappedAtTotal && (
                      <div className="mt-3 text-sm text-green-600 bg-green-50 p-2 rounded">
                        ↗ Overall attendance will improve by{" "}
                        {calculateProjectedAttendance.projectedPercentage -
                          calculateProjectedAttendance.currentPercentage}
                        % (adding to attended sessions only)
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveExtraAttendance}
              disabled={!selectedStudent || !extraSessions || !reason || saving}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? "Saving..." : "Add to Overall Total"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExtraAttendance
