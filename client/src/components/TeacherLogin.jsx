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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
        </div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          ></div>
        ))}
      </div>

      <div className="bg-white/10 backdrop-blur-2xl p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/20 relative z-10 transform hover:scale-105 transition-all duration-300">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-3xl blur-xl -z-10 animate-pulse"></div>

        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6 shadow-lg transform hover:rotate-12 transition-transform duration-300">
            <svg
              className="w-10 h-10 text-white filter drop-shadow-lg"
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
          <h2 className="text-4xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent mb-3 tracking-tight">
            Teacher Portal
          </h2>
          <p className="text-white/80 text-sm font-medium">
            Access your teaching dashboard
          </p>
        </div>

        {error && (
          <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-xl p-4 mb-6 animate-shake">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-red-400 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-red-200 text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="group">
            <label
              htmlFor="email"
              className="block text-white/90 text-sm font-semibold mb-3 group-focus-within:text-blue-300 transition-colors"
            >
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 text-white placeholder-white/50 hover:bg-white/15"
                placeholder="your.email@example.com"
                required
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 -z-10"></div>
            </div>
          </div>

          <div className="group">
            <label
              htmlFor="password"
              className="block text-white/90 text-sm font-semibold mb-3 group-focus-within:text-blue-300 transition-colors"
            >
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 text-white placeholder-white/50 hover:bg-white/15"
                placeholder="Enter your password"
                required
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 -z-10"></div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 hover:shadow-2xl relative overflow-hidden group"
            disabled={loading}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            {loading ? (
              <div className="flex items-center justify-center relative z-10">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                <span className="font-semibold tracking-wide">
                  Authenticating...
                </span>
              </div>
            ) : (
              <span className="relative z-10 font-semibold tracking-wide">
                Sign In
              </span>
            )}
          </button>
        </form>

        <div className="mt-8 text-center space-y-4">
          <p className="text-white/70 text-sm">
            Don't have an account?{" "}
            <Link
              to="/teacher-signup"
              className="text-blue-300 hover:text-blue-200 font-semibold hover:underline transition-all duration-300 hover:tracking-wide"
            >
              Sign up here
            </Link>
          </p>

          <div className="flex items-center">
            <div className="flex-1 border-t border-white/20"></div>
            <span className="px-4 text-white/50 text-xs font-medium">OR</span>
            <div className="flex-1 border-t border-white/20"></div>
          </div>

          <Link
            to="/hod-login"
            className="inline-flex items-center text-white/60 hover:text-white text-sm hover:underline transition-all duration-300 group"
          >
            <svg
              className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
            Login as Head of Department
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
          }
        }

        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(5px);
          }
        }

        .animate-float {
          animation: float linear infinite;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}

export default TeacherLogin
