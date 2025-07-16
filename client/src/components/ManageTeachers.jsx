// src/components/ManageTeachers.jsx

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

function ManageTeachers({ departmentId }) {
  const [teacherName, setTeacherName] = useState("")
  // subjectsTaught will be an array of objects: [{ subjectName: "", yearTaught: "" }]
  const [subjectsTaught, setSubjectsTaught] = useState([
    { subjectName: "", yearTaught: "" },
  ])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [addLoading, setAddLoading] = useState(false)

  const yearsOptions = ["1st Year", "2nd Year", "3rd Year", "Final Year"] // Define possible years

  // Fetch teachers when component mounts or departmentId changes
  useEffect(() => {
    const fetchTeachers = async () => {
      setLoading(true)
      setError("")
      try {
        const q = query(
          collection(db, "teachers"),
          where("department", "==", departmentId)
        )
        const querySnapshot = await getDocs(q)
        const teachersList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setTeachers(teachersList)
      } catch (err) {
        console.error("Error fetching teachers:", err)
        setError("Failed to fetch teachers.")
      } finally {
        setLoading(false)
      }
    }

    if (departmentId) {
      fetchTeachers()
    }
  }, [departmentId])

  // Handle adding new subject/year pair
  const handleAddSubject = () => {
    setSubjectsTaught([...subjectsTaught, { subjectName: "", yearTaught: "" }])
  }

  // Handle changes to a specific subject/year pair
  const handleSubjectChange = (index, field, value) => {
    const updatedSubjects = subjectsTaught.map((subject, i) =>
      i === index ? { ...subject, [field]: value } : subject
    )
    setSubjectsTaught(updatedSubjects)
  }

  // Handle removing a subject/year pair
  const handleRemoveSubject = (index) => {
    const updatedSubjects = subjectsTaught.filter((_, i) => i !== index)
    setSubjectsTaught(updatedSubjects)
  }

  // Handle adding a new teacher
  const handleAddTeacher = async (e) => {
    e.preventDefault()
    setError("")
    setAddLoading(true)

    if (!teacherName.trim()) {
      setError("Teacher name cannot be empty.")
      setAddLoading(false)
      return
    }

    // Validate subjects and years
    const hasInvalidSubject = subjectsTaught.some(
      (s) => !s.subjectName.trim() || !s.yearTaught.trim()
    )
    if (hasInvalidSubject) {
      setError("All subject and year fields must be filled.")
      setAddLoading(false)
      return
    }

    try {
      await addDoc(collection(db, "teachers"), {
        name: teacherName.trim(),
        department: departmentId,
        subjectsTaught: subjectsTaught,
        createdAt: new Date(),
      })
      setTeacherName("")
      setSubjectsTaught([{ subjectName: "", yearTaught: "" }]) // Reset form
      alert("Teacher added successfully!")
      // Re-fetch teachers to update the list
      const q = query(
        collection(db, "teachers"),
        where("department", "==", departmentId)
      )
      const querySnapshot = await getDocs(q)
      const teachersList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setTeachers(teachersList)
    } catch (err) {
      console.error("Error adding teacher:", err)
      setError("Failed to add teacher.")
    } finally {
      setAddLoading(false)
    }
  }

  // Handle deleting a teacher
  const handleDeleteTeacher = async (teacherId) => {
    if (window.confirm("Are you sure you want to delete this teacher?")) {
      try {
        await deleteDoc(doc(db, "teachers", teacherId))
        alert("Teacher deleted successfully!")
        setTeachers(teachers.filter((teacher) => teacher.id !== teacherId)) // Update UI
      } catch (err) {
        console.error("Error deleting teacher:", err)
        setError("Failed to delete teacher.")
      }
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">
        Manage Teachers for {departmentId}
      </h2>

      {/* Add Teacher Form */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Add New Teacher
        </h3>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        <form onSubmit={handleAddTeacher} className="space-y-4">
          <div>
            <label
              htmlFor="teacherName"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              Teacher Name:
            </label>
            <input
              type="text"
              id="teacherName"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>

          <div className="space-y-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Subjects Taught:
            </label>
            {subjectsTaught.map((subject, index) => (
              <div
                key={index}
                className="flex flex-wrap items-end gap-3 bg-gray-50 p-3 rounded-md"
              >
                <div className="flex-1 min-w-[150px]">
                  <label
                    htmlFor={`subjectName-${index}`}
                    className="block text-gray-600 text-xs font-bold mb-1"
                  >
                    Subject Name:
                  </label>
                  <input
                    type="text"
                    id={`subjectName-${index}`}
                    value={subject.subjectName}
                    onChange={(e) =>
                      handleSubjectChange(index, "subjectName", e.target.value)
                    }
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                    placeholder="e.g., Data Structures"
                    required
                  />
                </div>
                <div className="flex-1 min-w-[120px]">
                  <label
                    htmlFor={`yearTaught-${index}`}
                    className="block text-gray-600 text-xs font-bold mb-1"
                  >
                    Year Taught:
                  </label>
                  <select
                    id={`yearTaught-${index}`}
                    value={subject.yearTaught}
                    onChange={(e) =>
                      handleSubjectChange(index, "yearTaught", e.target.value)
                    }
                    className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                    required
                  >
                    <option value="">Select Year</option>
                    {yearsOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                {subjectsTaught.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSubject(index)}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 rounded text-sm transition-colors duration-200"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddSubject}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors duration-200 mt-2"
            >
              Add Another Subject
            </button>
          </div>

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full transition-colors duration-200"
            disabled={addLoading}
          >
            {addLoading ? "Adding Teacher..." : "Add Teacher"}
          </button>
        </form>
      </div>

      {/* View All Teachers */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          All Teachers ({departmentId})
        </h3>
        {loading ? (
          <p className="text-blue-600">Loading teachers...</p>
        ) : teachers.length === 0 ? (
          <p className="text-gray-600">
            No teachers found for this department.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left">Teacher Name</th>
                  <th className="py-3 px-6 text-left">Subjects Taught</th>
                  <th className="py-3 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 text-sm font-light">
                {teachers.map((teacher) => (
                  <tr
                    key={teacher.id}
                    className="border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td className="py-3 px-6 text-left whitespace-nowrap">
                      {teacher.name}
                    </td>
                    <td className="py-3 px-6 text-left">
                      {teacher.subjectsTaught &&
                      teacher.subjectsTaught.length > 0 ? (
                        <ul className="list-disc list-inside">
                          {teacher.subjectsTaught.map((s, idx) => (
                            <li key={idx}>
                              {s.subjectName} ({s.yearTaught})
                            </li>
                          ))}
                        </ul>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="py-3 px-6 text-center">
                      <button
                        onClick={() => handleDeleteTeacher(teacher.id)}
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

export default ManageTeachers
