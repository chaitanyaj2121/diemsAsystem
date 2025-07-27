// src/components/TeacherLogin.jsx

import React, { useState } from "react"
import { auth, db } from "../firebase/config" // Adjust path as needed
import { signInWithEmailAndPassword } from "firebase/auth"
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore"
import { useNavigate, Link } from "react-router-dom"

function TeacherLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    // Convert email to lowercase for consistent handling
    const lowercasedEmail = email.toLowerCase()
    console.log("🔍 Starting login process for email:", lowercasedEmail)

    try {
      // Step 1: Firebase Auth login
      console.log("🔑 Attempting Firebase Auth login...")
      const userCredential = await signInWithEmailAndPassword(
        auth,
        lowercasedEmail, // Use the lowercased email here
        password
      )
      const user = userCredential.user

      console.log("✅ Firebase Auth successful!")
      console.log("📧 User email from auth:", user.email)
      console.log("🆔 User UID:", user.uid)

      // Step 2: Find teacher by email
      console.log("🔍 Searching for teacher profile by email...")
      const teachersQuery = query(
        collection(db, "teachers"),
        where("email", "==", lowercasedEmail) // Use the lowercased email for the query
      )

      const teachersSnapshot = await getDocs(teachersQuery)
      console.log("📊 Teachers query result - empty?", teachersSnapshot.empty)
      console.log("📊 Teachers query result - size:", teachersSnapshot.size)

      if (!teachersSnapshot.empty) {
        const teacherDoc = teachersSnapshot.docs[0]
        const teacherData = teacherDoc.data()

        console.log("✅ Found teacher profile!")
        console.log("📄 Teacher document ID:", teacherDoc.id)
        console.log("📄 Teacher data:", teacherData)
        console.log("👤 Teacher role:", teacherData.role)
        console.log("🆔 Teacher userId:", teacherData.userId)
        console.log("🏢 Teacher department:", teacherData.department)

        // Update the teacher document with userId and role if not already set
        const updates = {}
        if (!teacherData.userId) {
          updates.userId = user.uid
        }
        if (!teacherData.role) {
          updates.role = "Teacher"
        }

        if (Object.keys(updates).length > 0) {
          console.log("🔄 Updating teacher document with:", updates)
          try {
            await updateDoc(teacherDoc.ref, updates)
            console.log("✅ Successfully updated teacher document")
          } catch (updateError) {
            console.error("❌ Error updating teacher document:", updateError)
            console.error("❌ Update error code:", updateError.code)
            console.error("❌ Update error message:", updateError.message)
          }
        }

        // Check role and redirect to appropriate dashboard
        const finalRole = teacherData.role || "Teacher"
        if (finalRole === "Teacher") {
          console.log(
            "🎉 Login successful! Redirecting to teacher dashboard..."
          )

          // Store teacher data in localStorage for dashboard use
          localStorage.setItem(
            "teacherData",
            JSON.stringify({
              id: teacherDoc.id,
              ...teacherData,
              userId: teacherData.userId || user.uid,
              role: finalRole,
            })
          )

          // Redirect to teacher dashboard
          navigate("/teacher-dashboard")
          return
        } else {
          console.log("❌ Invalid role:", finalRole)
          setError(`Invalid role: ${finalRole}. Expected: Teacher`)
        }
      } else {
        // Step 3: Fallback - try finding by userId (if the email query failed, maybe UID directly matches)
        console.log("🔍 Trying to find teacher by userId as fallback...")
        try {
          const teacherDocRef = doc(db, "teachers", user.uid)
          const teacherDocSnap = await getDoc(teacherDocRef)

          console.log("📄 Teacher by UID - exists?", teacherDocSnap.exists())

          if (teacherDocSnap.exists()) {
            const teacherData = teacherDocSnap.data()
            console.log("📄 Teacher data by UID:", teacherData)

            const finalRole = teacherData.role || "Teacher"
            if (finalRole === "Teacher") {
              console.log(
                "🎉 Login successful via UID! Redirecting to dashboard..."
              )

              // Store teacher data in localStorage
              localStorage.setItem(
                "teacherData",
                JSON.stringify({
                  id: user.uid,
                  ...teacherData,
                  userId: user.uid,
                  role: finalRole,
                })
              )

              navigate("/teacher-dashboard")
              return
            } else {
              console.log("❌ Invalid role from UID lookup:", teacherData.role)
            }
          }
        } catch (docError) {
          console.error("❌ Error getting teacher document by UID:", docError)
          console.error("❌ Doc error code:", docError.code)
          console.error("❌ Doc error message:", docError.message)
        }

        // If we reach here, teacher was not found
        console.log("❌ Teacher profile not found in Firestore")
        setError(
          "Authentication successful, but you are not registered as a teacher or your profile is incomplete. Please contact your HoD."
        )
        await auth.signOut() // Sign out if not a valid teacher profile
      }
    } catch (err) {
      console.error("❌ Error during teacher login:", err)
      console.error("❌ Error code:", err.code)
      console.error("❌ Error message:", err.message)
      console.error("❌ Full error object:", err)

      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential" //firebase newer versions might return this for invalid email/password
      ) {
        setError("Invalid email or password.")
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.")
      } else if (err.code === "permission-denied") {
        setError(
          "Permission denied. Please check your Firestore security rules."
        )
      } else {
        setError("Failed to log in. " + err.message)
      }
    } finally {
      setLoading(false)
      console.log("🏁 Login process finished")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Teacher Login
          </h2>
          <p className="text-gray-600 text-sm">Access your teacher dashboard</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-gray-700 text-sm font-semibold mb-2"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="your.email@example.com"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-gray-700 text-sm font-semibold mb-2"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Logging In...
              </div>
            ) : (
              "Login"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Don't have an account?{" "}
            <Link
              to="/teacher-signup"
              className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors"
            >
              Sign up here
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link
            to="/hod-login"
            className="text-gray-500 hover:text-gray-700 text-sm hover:underline transition-colors"
          >
            Login as HoD
          </Link>
        </div>
      </div>
    </div>
  )
}

export default TeacherLogin
