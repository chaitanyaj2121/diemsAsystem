// src/components/TakeAttendance.jsx

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

  useEffect(() => {
    // Reset state when subject or year changes
    setStudentsForAttendance([])
    setAttendance({})
    setMessage("")
    setError("")

    if (selectedSubject && selectedYear && department) {
      fetchStudentsForAttendance(department, selectedYear)
    }
  }, [selectedSubject, selectedYear, department])

  const fetchStudentsForAttendance = async (dept, year) => {
    setLoading(true)
    setError("")
    try {
      const studentsQuery = query(
        collection(db, "students"),
        where("department", "==", dept),
        where("year", "==", year)
      )
      const studentsSnapshot = await getDocs(studentsQuery)
      const studentsData = studentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setStudentsForAttendance(studentsData)
      // Initialize all students as present by default
      const initialAttendance = {}
      studentsData.forEach((student) => {
        initialAttendance[student.id] = true
      })
      setAttendance(initialAttendance)
      setMessage("")
    } catch (err) {
      console.error("Error fetching students for attendance:", err)
      setError("Failed to load students for this subject/year.")
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

  const handleSubmitAttendance = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    setError("")

    if (
      !selectedSubject ||
      !selectedYear ||
      studentsForAttendance.length === 0
    ) {
      setError(
        "Please select a subject and year, and ensure students are loaded."
      )
      setLoading(false)
      return
    }

    try {
      const attendanceRecord = {
        teacherId: teacherId,
        department: department,
        subjectName: selectedSubject,
        year: selectedYear,
        date: Timestamp.fromDate(new Date()), // Store current date and time
        attendanceData: Object.entries(attendance).map(
          ([studentId, isPresent]) => ({
            studentId,
            isPresent,
          })
        ),
      }

      await addDoc(collection(db, "attendance"), attendanceRecord)
      setMessage("Attendance submitted successfully!")
      // Optionally reset form or provide feedback
      setSelectedSubject("")
      setSelectedYear("")
      setStudentsForAttendance([])
      setAttendance({})
    } catch (err) {
      console.error("Error submitting attendance:", err)
      setError("Failed to submit attendance. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">
        Take Attendance
      </h3>

      <form onSubmit={handleSubmitAttendance} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            Loading students...
          </div>
        )}

        {selectedSubject &&
          selectedYear &&
          studentsForAttendance.length > 0 && (
            <div className="mt-6">
              <h4 className="text-md font-semibold text-gray-700 mb-4">
                Mark Attendance for {selectedSubject} ({selectedYear})
              </h4>
              <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Roll Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student Name
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Present
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {studentsForAttendance.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.rollNo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {student.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
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
                  "Submit Attendance"
                )}
              </button>
            </div>
          )}

        {selectedSubject &&
          selectedYear &&
          studentsForAttendance.length === 0 &&
          !loading &&
          !error && (
            <div className="mt-6 p-4 text-center text-gray-500 border border-gray-200 rounded-md">
              No students found for this subject and year.
            </div>
          )}
      </form>
    </div>
  )
}

export default TakeAttendance
