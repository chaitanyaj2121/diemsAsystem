// src/components/TeacherSignup.jsx

import React, { useState } from "react"
import { auth, db } from "../firebase/config" // Adjust path as needed
import { createUserWithEmailAndPassword } from "firebase/auth"
import {
  doc,
  updateDoc,
  query,
  collection,
  where,
  getDocs,
} from "firebase/firestore" // For linking account later
import { useNavigate, Link } from "react-router-dom"

function TeacherSignup() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSignup = async (e) => {
    e.preventDefault()
    setError("") // Clear previous errors
    setLoading(true)

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password should be at least 6 characters.")
      setLoading(false)
      return
    }

    try {
      // 1. Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      )
      const user = userCredential.user

      // 2. Attempt to link this new user's UID to an existing teacher profile in Firestore
      //    This assumes the HoD has already added the teacher's email.
      const teachersRef = collection(db, "teachers")
      const q = query(teachersRef, where("email", "==", email.trim()))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        // Found an existing teacher profile with this email
        const teacherDoc = querySnapshot.docs[0]
        const teacherDocRef = doc(db, "teachers", teacherDoc.id)

        // Update the teacher document with the new Firebase Auth UID
        await updateDoc(teacherDocRef, {
          userId: user.uid, // Store the Firebase Auth UID
          role: "Teacher", // Explicitly set role if not already set by HoD
        })
        alert("Account created and linked to your teacher profile!")
      } else {
        // No existing teacher profile found with this email.
        // This scenario implies the teacher is trying to sign up without being added by an HoD.
        // You might want to handle this differently (e.g., create a pending profile, inform them to contact HoD).
        // For now, we'll inform them and allow signup, but their dashboard might show limited info until linked.
        // Or, more strictly, you could prevent signup if no matching teacher profile exists.
        // For this example, we'll just log it and inform the user.
        console.warn(
          "No existing teacher profile found for this email. Please contact your HoD to link your account."
        )
        alert(
          "Account created! Please contact your HoD to ensure your profile is linked correctly."
        )
      }

      navigate("/teacher-login") // Redirect to login page after successful signup
    } catch (err) {
      console.error("Error during teacher signup:", err.message)
      if (err.code === "auth/email-already-in-use") {
        setError(
          "This email is already in use. Please log in or use a different email."
        )
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.")
      } else {
        setError("Failed to create account. " + err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Teacher Signup
        </h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              Email:
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="your.email@example.com"
              required
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              Password:
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="******"
              required
            />
          </div>
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              Confirm Password:
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="******"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full transition-colors duration-200"
            disabled={loading}
          >
            {loading ? "Signing Up..." : "Signup"}
          </button>
        </form>
        <p className="text-center text-gray-600 text-sm mt-4">
          Already have an account?{" "}
          <Link to="/teacher-login" className="text-blue-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}

export default TeacherSignup
