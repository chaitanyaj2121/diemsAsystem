import React, { useState } from "react"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth, db } from "../firebase/config"
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore"
import { useNavigate, Link } from "react-router-dom"

const StudentLogin = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // Convert email to lowercase before authentication and Firestore query
      const lowercasedEmail = email.toLowerCase()

      // First, authenticate with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        auth,
        lowercasedEmail, // Use lowercased email for authentication
        password
      )
      const user = userCredential.user

      // Check if student exists in Firestore
      const studentsQuery = query(
        collection(db, "students"),
        where("email", "==", lowercasedEmail) // Use lowercased email for Firestore query
      )
      const studentsSnapshot = await getDocs(studentsQuery)

      if (studentsSnapshot.empty) {
        setError("No student account found with this email.")
        await auth.signOut()
        setLoading(false)
        return
      }

      // Get student data
      const studentDoc = studentsSnapshot.docs[0]
      const studentData = studentDoc.data()

      // Update student document with userId if not already set
      if (!studentData.userId) {
        await updateDoc(doc(db, "students", studentDoc.id), {
          userId: user.uid,
        })
        studentData.userId = user.uid
      }

      // Store student data in localStorage
      localStorage.setItem(
        "studentData",
        JSON.stringify({
          id: studentDoc.id,
          ...studentData,
        })
      )
      alert("Login Success!!")
      // Navigate to student dashboard
      navigate("/student-dashboard")
    } catch (err) {
      let errorMessage = "Login failed. Please try again."

      switch (err.code) {
        case "auth/user-not-found":
          errorMessage = "No account found with this email."
          break
        case "auth/wrong-password":
          errorMessage = "Incorrect password."
          break
        case "auth/invalid-email":
          errorMessage = "Please enter a valid email address."
          break
        case "auth/too-many-requests":
          errorMessage = "Too many failed attempts. Please try again later."
          break
        case "auth/network-request-failed":
          errorMessage = "Network error. Please check your connection."
          break
        default:
          errorMessage = err.message || "Login failed. Please try again."
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
        </div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          ></div>
        ))}
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center transform hover:scale-105 transition-transform duration-300">
          <div className="mx-auto h-20 w-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mb-6 shadow-2xl transform hover:rotate-12 transition-transform duration-300 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/50 to-teal-500/50 rounded-full blur-lg animate-pulse"></div>
            <svg
              className="h-10 w-10 text-white filter drop-shadow-lg relative z-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 14l9-5-9-5-9 5 9 5z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
              />
            </svg>
          </div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-transparent mb-3 tracking-tight">
            Student Portal
          </h2>
          <p className="text-white/80 text-sm font-medium">
            Access your academic dashboard and attendance records
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 border border-white/20 relative overflow-hidden transform hover:scale-102 transition-all duration-300">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 rounded-3xl blur-xl -z-10 animate-pulse"></div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-xl p-4 animate-shake">
                <div className="flex items-center">
                  <svg
                    className="h-5 w-5 text-red-400 mr-3 animate-pulse"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
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

            <div className="group">
              <label
                htmlFor="email"
                className="block text-white/90 text-sm font-semibold mb-3 group-focus-within:text-emerald-300 transition-colors"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-white/60 group-focus-within:text-emerald-400 transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    />
                  </svg>
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-300 text-white placeholder-white/60 hover:bg-white/15"
                  placeholder="Enter your student email"
                  required
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-600/20 to-teal-600/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 -z-10"></div>
              </div>
            </div>

            <div className="group">
              <label
                htmlFor="password"
                className="block text-white/90 text-sm font-semibold mb-3 group-focus-within:text-emerald-300 transition-colors"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-white/60 group-focus-within:text-emerald-400 transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-12 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-300 text-white placeholder-white/60 hover:bg-white/15"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center hover:scale-110 transition-transform duration-200"
                >
                  {showPassword ? (
                    <svg
                      className="h-5 w-5 text-white/60 hover:text-white transition-colors"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464m1.414 1.414L12 12m-1.536-1.536L8.464 8.464m0 0L7.05 7.05m11.314 0L16.95 8.464M19.435 4.565L16.95 8.464m-2.829 2.828L12 12"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5 text-white/60 hover:text-white transition-colors"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-600/20 to-teal-600/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 -z-10"></div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-4 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 hover:shadow-2xl relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              {loading ? (
                <div className="flex items-center justify-center relative z-10">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-6 w-6 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span className="font-semibold tracking-wide">
                    Signing in...
                  </span>
                </div>
              ) : (
                <span className="relative z-10 font-semibold tracking-wide">
                  Access Dashboard
                </span>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center space-y-4">
            <p className="text-white/70 text-sm">
              Don't have an account?{" "}
              <Link
                to="/student-signup"
                className="text-emerald-300 hover:text-emerald-200 font-semibold hover:underline transition-all duration-300 hover:tracking-wide"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </div>

        {/* Additional Links */}
        <div className="text-center">
          <Link
            to="/"
            className="inline-flex items-center text-white/60 hover:text-white text-sm transition-all duration-300 group hover:tracking-wide"
          >
            <svg
              className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
            opacity: 0.7;
          }
          50% {
            transform: translateY(-15px) rotate(180deg);
            opacity: 1;
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

        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  )
}

export default StudentLogin
