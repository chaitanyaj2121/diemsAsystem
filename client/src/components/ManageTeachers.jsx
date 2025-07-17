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
  const [teacherEmail, setTeacherEmail] = useState("")
  // subjectsTaught will be an array of objects: [{ subjectName: "", yearTaught: "", hasPractical: false, practicalBatches: [] }]
  const [subjectsTaught, setSubjectsTaught] = useState([
    {
      subjectName: "",
      yearTaught: "",
      hasPractical: false,
      practicalBatches: [],
    },
  ])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [addLoading, setAddLoading] = useState(false)

  const yearsOptions = ["1st Year", "2nd Year", "3rd Year", "Final Year"]

  // Generate batch options (assuming batches A, B, C, D, E for each year)
  const generateBatchOptions = (year) => {
    const batchLetters = ["B1", "B2", "B3", "B4", "B5"]
    return batchLetters.map((letter) => `${year} - Batch ${letter}`)
  }

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
    setSubjectsTaught([
      ...subjectsTaught,
      {
        subjectName: "",
        yearTaught: "",
        hasPractical: false,
        practicalBatches: [],
      },
    ])
  }

  // Handle changes to a specific subject/year pair
  const handleSubjectChange = (index, field, value) => {
    const updatedSubjects = subjectsTaught.map((subject, i) => {
      if (i === index) {
        const updatedSubject = { ...subject, [field]: value }
        // If hasPractical is set to false, clear practicalBatches
        if (field === "hasPractical" && !value) {
          updatedSubject.practicalBatches = []
        }
        // If year changes, clear practical batches to avoid confusion
        if (field === "yearTaught") {
          updatedSubject.practicalBatches = []
        }
        return updatedSubject
      }
      return subject
    })
    setSubjectsTaught(updatedSubjects)
  }

  // Handle practical batch selection
  const handlePracticalBatchChange = (subjectIndex, batchValue, isChecked) => {
    const updatedSubjects = subjectsTaught.map((subject, i) => {
      if (i === subjectIndex) {
        let updatedBatches = [...subject.practicalBatches]
        if (isChecked) {
          if (!updatedBatches.includes(batchValue)) {
            updatedBatches.push(batchValue)
          }
        } else {
          updatedBatches = updatedBatches.filter(
            (batch) => batch !== batchValue
          )
        }
        return { ...subject, practicalBatches: updatedBatches }
      }
      return subject
    })
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

    // Validate inputs including new teacherEmail
    if (!teacherName.trim() || !teacherEmail.trim()) {
      setError("Teacher name and email cannot be empty.")
      setAddLoading(false)
      return
    }

    // Basic email format validation
    if (!/\S+@\S+\.\S+/.test(teacherEmail.trim())) {
      setError("Please enter a valid email address.")
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

    // Validate practical batches (if practical is enabled, at least one batch should be selected)
    const hasInvalidPractical = subjectsTaught.some(
      (s) => s.hasPractical && s.practicalBatches.length === 0
    )
    if (hasInvalidPractical) {
      setError("Please select at least one batch for subjects with practicals.")
      setAddLoading(false)
      return
    }

    try {
      await addDoc(collection(db, "teachers"), {
        name: teacherName.trim(),
        email: teacherEmail.trim(),
        department: departmentId,
        subjectsTaught: subjectsTaught,
        createdAt: new Date(),
      })
      setTeacherName("")
      setTeacherEmail("")
      setSubjectsTaught([
        {
          subjectName: "",
          yearTaught: "",
          hasPractical: false,
          practicalBatches: [],
        },
      ])
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
        setTeachers(teachers.filter((teacher) => teacher.id !== teacherId))
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

          <div>
            <label
              htmlFor="teacherEmail"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              Teacher Email:
            </label>
            <input
              type="email"
              id="teacherEmail"
              value={teacherEmail}
              onChange={(e) => setTeacherEmail(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="example@college.com"
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
                className="bg-gray-50 p-4 rounded-md border border-gray-200"
              >
                <div className="flex flex-wrap items-end gap-3 mb-3">
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
                        handleSubjectChange(
                          index,
                          "subjectName",
                          e.target.value
                        )
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

                {/* Practical Section */}
                <div className="mt-4">
                  <div className="flex items-center mb-3">
                    <input
                      type="checkbox"
                      id={`hasPractical-${index}`}
                      checked={subject.hasPractical}
                      onChange={(e) =>
                        handleSubjectChange(
                          index,
                          "hasPractical",
                          e.target.checked
                        )
                      }
                      className="mr-2"
                    />
                    <label
                      htmlFor={`hasPractical-${index}`}
                      className="text-gray-600 text-sm font-bold"
                    >
                      This subject has practical sessions
                    </label>
                  </div>

                  {subject.hasPractical && subject.yearTaught && (
                    <div className="ml-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                      <p className="text-gray-600 text-sm font-bold mb-2">
                        Select Practical Batches for {subject.yearTaught}:
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                        {generateBatchOptions(subject.yearTaught).map(
                          (batch) => (
                            <label
                              key={batch}
                              className="flex items-center text-sm cursor-pointer hover:bg-blue-100 p-2 rounded"
                            >
                              <input
                                type="checkbox"
                                checked={subject.practicalBatches.includes(
                                  batch
                                )}
                                onChange={(e) =>
                                  handlePracticalBatchChange(
                                    index,
                                    batch,
                                    e.target.checked
                                  )
                                }
                                className="mr-2"
                              />
                              <span className="text-gray-700">{batch}</span>
                            </label>
                          )
                        )}
                      </div>
                      {subject.practicalBatches.length > 0 && (
                        <p className="text-xs text-blue-600 mt-2">
                          Selected: {subject.practicalBatches.join(", ")}
                        </p>
                      )}
                    </div>
                  )}
                </div>
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
                  <th className="py-3 px-6 text-left">Email</th>
                  <th className="py-3 px-6 text-left">Subjects & Practicals</th>
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
                    <td className="py-3 px-6 text-left">{teacher.email}</td>
                    <td className="py-3 px-6 text-left">
                      {teacher.subjectsTaught &&
                      teacher.subjectsTaught.length > 0 ? (
                        <div className="space-y-2">
                          {teacher.subjectsTaught.map((s, idx) => (
                            <div
                              key={idx}
                              className="border-l-4 border-blue-400 pl-3"
                            >
                              <div className="font-medium">
                                {s.subjectName} ({s.yearTaught})
                              </div>
                              {s.hasPractical &&
                                s.practicalBatches &&
                                s.practicalBatches.length > 0 && (
                                  <div className="text-xs text-green-600 mt-1">
                                    <span className="font-medium">
                                      Practical Batches:
                                    </span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {s.practicalBatches.map(
                                        (batch, batchIdx) => (
                                          <span
                                            key={batchIdx}
                                            className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs"
                                          >
                                            {batch}
                                          </span>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )}
                            </div>
                          ))}
                        </div>
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
