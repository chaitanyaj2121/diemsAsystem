// src/components/AddSpecificStudents.jsx

import React, { useState } from "react"
import { db } from "../firebase/config" // Adjust path as needed
import { collection, addDoc, Timestamp } from "firebase/firestore"

// Function to generate a random name (for demonstration purposes)
const generateRandomName = () => {
  const firstNames = [
    "Alice",
    "Bob",
    "Charlie",
    "David",
    "Eve",
    "Frank",
    "Grace",
    "Heidi",
    "Ivan",
    "Judy",
    "Kelly",
    "Liam",
    "Mia",
    "Noah",
    "Olivia",
    "Peter",
    "Quinn",
    "Rachel",
    "Sam",
    "Tina",
    "Uma",
    "Victor",
    "Wendy",
    "Xavier",
    "Yara",
    "Zack",
  ]
  const lastNames = [
    "Smith",
    "Jones",
    "Williams",
    "Brown",
    "Davis",
    "Miller",
    "Wilson",
    "Moore",
    "Taylor",
    "Anderson",
    "Thomas",
    "Jackson",
    "White",
    "Harris",
    "Martin",
    "Thompson",
    "Garcia",
    "Martinez",
    "Robinson",
    "Clark",
    "Rodriguez",
    "Lewis",
    "Lee",
    "Walker",
    "Hall",
    "Allen",
  ]
  const randomFirstName =
    firstNames[Math.floor(Math.random() * firstNames.length)]
  const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)]
  return `${randomFirstName} ${randomLastName}`
}

// Generate 69 random students with roll numbers from AI2101 to AI2169
const studentData = Array.from({ length: 69 }, (_, i) => {
  const rollNo = `AI21${(i + 1).toString().padStart(2, "0")}`
  return { rollNo, name: generateRandomName() }
})

const AddSpecificStudents = () => {
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(false)
  const [addedCount, setAddedCount] = useState(0)

  const addStudentsToFirestore = async () => {
    setLoading(true)
    setStatus("Adding students...")
    setAddedCount(0)
    const studentsPerBatch = 15 // Define how many students per batch

    try {
      for (let i = 0; i < studentData.length; i++) {
        const student = studentData[i]

        // Calculate batch number
        const batchNumber = Math.floor(i / studentsPerBatch) + 1
        const batchName = `B${batchNumber}` // Simplified batch name

        // Generate a simple email based on roll number and name
        const email = `${student.name.toLowerCase().replace(/\s/g, ".")}.${
          student.rollNo
        }@example.com`

        const studentDoc = {
          name: student.name,
          rollNo: student.rollNo,
          email: email,
          department: "Computer Science",
          year: "2nd Year", // Changed to 2nd Year
          batch: batchName, // Add the simplified batch field here
          createdAt: Timestamp.fromDate(new Date()), // Current timestamp
          userId: null, // Will be set during student signup/login if they create an account
        }
        await addDoc(collection(db, "students"), studentDoc)
        console.log(
          `Added student: ${student.name} (${student.rollNo}) to ${batchName}`
        )
        setAddedCount((prev) => prev + 1)
      }
      setStatus(`Successfully added ${studentData.length} students!`)
    } catch (e) {
      console.error("Error adding documents: ", e)
      setStatus(`Error adding students: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-md mx-auto mt-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Add Specific Students
      </h2>
      <p className="text-gray-600 mb-4">
        Click the button below to add the provided list of students to the
        "Computer Science" department, "2nd Year", with **simplified batch
        assignments (e.g., B1, B2)**.
      </p>
      <button
        onClick={addStudentsToFirestore}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Adding {addedCount}/{studentData.length}...
          </div>
        ) : (
          `Add ${studentData.length} Specific Students`
        )}
      </button>
      {status && (
        <p
          className={`mt-4 text-center ${
            status.includes("Error") ? "text-red-600" : "text-green-600"
          }`}
        >
          {status}
        </p>
      )}
    </div>
  )
}

export default AddSpecificStudents
