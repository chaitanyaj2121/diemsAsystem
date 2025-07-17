// src/components/ManageStudents.jsx

import React, { useState, useEffect } from "react"
import { db } from "../firebase/config" // Adjust path as needed
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
} from "firebase/firestore"

function ManageStudents({ departmentId }) {
  const [studentName, setStudentName] = useState("")
  const [studentRollNo, setStudentRollNo] = useState("")
  const [studentEmail, setStudentEmail] = useState("")
  const [selectedYear, setSelectedYear] = useState("")
  const [selectedBatch, setSelectedBatch] = useState("") // New state for selected batch
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [addLoading, setAddLoading] = useState(false)

  const yearsOptions = ["1st Year", "2nd Year", "3rd Year", "Final Year"]
  const batchesOptions = ["B1", "B2", "B3", "B4", "B5"] // Options for batches

  // Fetch students when component mounts or departmentId/selectedYear/selectedBatch changes
  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true)
      setError("")
      try {
        let q = query(
          collection(db, "students"),
          where("department", "==", departmentId)
        )

        // If a year is selected, filter by year
        if (selectedYear) {
          q = query(q, where("year", "==", selectedYear))
        }

        // If a batch is selected, filter by batch as well
        if (selectedBatch) {
          q = query(q, where("batch", "==", selectedBatch))
        }

        const querySnapshot = await getDocs(q)
        const studentsList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setStudents(studentsList)
      } catch (err) {
        console.error("Error fetching students:", err)
        setError("Failed to fetch students.")
      } finally {
        setLoading(false)
      }
    }

    if (departmentId) {
      fetchStudents()
    }
  }, [departmentId, selectedYear, selectedBatch]) // Re-fetch when departmentId, selectedYear, or selectedBatch changes

  // Handle adding a new student
  const handleAddStudent = async (e) => {
    e.preventDefault()
    setError("")
    setAddLoading(true)

    if (
      !studentName.trim() ||
      !studentRollNo.trim() ||
      !studentEmail.trim() ||
      !selectedYear.trim() ||
      !selectedBatch.trim() // Batch is now required
    ) {
      setError("All fields (Name, Roll No, Email, Year, Batch) are required.")
      setAddLoading(false)
      return
    }

    // Basic email format validation (can be more robust if needed)
    if (!/\S+@\S+\.\S+/.test(studentEmail.trim())) {
      setError("Please enter a valid email address for the student.")
      setAddLoading(false)
      return
    }

    try {
      await addDoc(collection(db, "students"), {
        name: studentName.trim(),
        rollNo: studentRollNo.trim(),
        email: studentEmail.trim(),
        department: departmentId,
        year: selectedYear,
        batch: selectedBatch, // Store the selected batch
        createdAt: new Date(),
        userId: null, // Assuming userId is initially null as per your example
      })
      setStudentName("")
      setStudentRollNo("")
      setStudentEmail("")
      setSelectedBatch("") // Reset batch field after submission
      // No need to reset selectedYear, it can remain for adding more students to the same year
      alert("Student added successfully!")

      // Re-fetch students to update the list, ensuring current filters are maintained
      const q = query(
        collection(db, "students"),
        where("department", "==", departmentId),
        where("year", "==", selectedYear),
        where("batch", "==", selectedBatch) // Ensure we only re-fetch for the current batch
      )
      const querySnapshot = await getDocs(q)
      const updatedStudentsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setStudents(updatedStudentsList)
    } catch (err) {
      console.error("Error adding student:", err)
      setError("Failed to add student.")
    } finally {
      setAddLoading(false)
    }
  }

  // Handle deleting a student
  const handleDeleteStudent = async (studentId) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      try {
        await deleteDoc(doc(db, "students", studentId))
        alert("Student deleted successfully!")
        setStudents(students.filter((student) => student.id !== studentId)) // Update UI
      } catch (err) {
        console.error("Error deleting student:", err)
        setError("Failed to delete student.")
      }
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">
        Manage Students for {departmentId}
      </h2>

      {/* Add Student Form */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Add New Student
        </h3>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        <form onSubmit={handleAddStudent} className="space-y-4">
          <div>
            <label
              htmlFor="studentName"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              Student Name:
            </label>
            <input
              type="text"
              id="studentName"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div>
            <label
              htmlFor="studentRollNo"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              Roll Number:
            </label>
            <input
              type="text"
              id="studentRollNo"
              value={studentRollNo}
              onChange={(e) => setStudentRollNo(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div>
            <label
              htmlFor="studentEmail"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              Student Email:
            </label>
            <input
              type="email"
              id="studentEmail"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="student@example.com"
              required
            />
          </div>
          <div>
            <label
              htmlFor="studentYear"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              Select Year:
            </label>
            <select
              id="studentYear"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-white"
              required
            >
              <option value="">-- Select Year --</option>
              {yearsOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          {/* New Batch Selection Dropdown for adding students */}
          <div>
            <label
              htmlFor="studentBatch"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              Select Batch:
            </label>
            <select
              id="studentBatch"
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-white"
              required
            >
              <option value="">-- Select Batch --</option>
              {batchesOptions.map((batch) => (
                <option key={batch} value={batch}>
                  {batch}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full transition-colors duration-200"
            disabled={addLoading}
          >
            {addLoading ? "Adding Student..." : "Add Student"}
          </button>
        </form>
      </div>

      {/* View All Students */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          All Students ({departmentId})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Year Filter for Viewing Students */}
          <div>
            <label
              htmlFor="filterYear"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              Filter by Year:
            </label>
            <select
              id="filterYear"
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value)
                setSelectedBatch("") // Reset batch filter when year changes
              }}
              className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-white"
            >
              <option value="">All Years</option>
              {yearsOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* New Batch Filter for Viewing Students */}
          <div>
            <label
              htmlFor="filterBatch"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              Filter by Batch:
            </label>
            <select
              id="filterBatch"
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-white"
            >
              <option value="">All Batches</option>
              {batchesOptions.map((batch) => (
                <option key={batch} value={batch}>
                  {batch}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <p className="text-blue-600">Loading students...</p>
        ) : students.length === 0 ? (
          <p className="text-gray-600">
            No students found for this department and selected criteria.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left">Student Name</th>
                  <th className="py-3 px-6 text-left">Roll Number</th>
                  <th className="py-3 px-6 text-left">Email</th>
                  <th className="py-3 px-6 text-left">Year</th>
                  <th className="py-3 px-6 text-left">Batch</th>{" "}
                  {/* New column header for batch */}
                  <th className="py-3 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 text-sm font-light">
                {students.map((student) => (
                  <tr
                    key={student.id}
                    className="border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td className="py-3 px-6 text-left whitespace-nowrap">
                      {student.name}
                    </td>
                    <td className="py-3 px-6 text-left">{student.rollNo}</td>
                    <td className="py-3 px-6 text-left">{student.email}</td>
                    <td className="py-3 px-6 text-left">{student.year}</td>
                    <td className="py-3 px-6 text-left">
                      {student.batch}
                    </td>{" "}
                    {/* Display student's batch */}
                    <td className="py-3 px-6 text-center">
                      <button
                        onClick={() => handleDeleteStudent(student.id)}
                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded text-xs transition-colors duration-200"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default ManageStudents
