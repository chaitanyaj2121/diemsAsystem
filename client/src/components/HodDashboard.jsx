// src/components/HodDashboard.jsx

import React, { useState, useEffect } from "react"
import { auth, db } from "../firebase/config" // Adjust path as needed
import { signOut } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { useNavigate } from "react-router-dom"

// Import the necessary components
import ManageTeachers from "./ManageTeachers"
import ManageStudents from "./ManageStudents"

// Removed placeholder components for SubjectsManagement, ClassesManagement, and AccountManagement
// as they are no longer needed.

function HodDashboard() {
  const [hodData, setHodData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("teachers") // Default active tab
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const hodDocRef = doc(db, "hods", user.uid)
        try {
          const hodDocSnap = await getDoc(hodDocRef)
          if (hodDocSnap.exists() && hodDocSnap.data().role === "HoD") {
            setHodData({ uid: user.uid, ...hodDocSnap.data() })
            // If the active tab was one of the removed ones, default to 'teachers'
            if (
              !["teachers", "students", "attendance", "defaulters"].includes(
                activeTab
              )
            ) {
              setActiveTab("teachers")
            }
          } else {
            setError("Unauthorized access. Please log in as an HoD.")
            await signOut(auth)
            navigate("/hod-login")
          }
        } catch (err) {
          console.error("Error fetching HoD data:", err)
          setError("Failed to load HoD data.")
          await signOut(auth)
          navigate("/hod-login")
        } finally {
          setLoading(false)
        }
      } else {
        navigate("/hod-login")
      }
    })

    return () => unsubscribe() // Cleanup subscription
  }, [navigate, activeTab]) // Added activeTab to dependency array to handle re-render if it changes

  const handleLogout = async () => {
    try {
      await signOut(auth)
      navigate("/hod-login")
    } catch (err) {
      console.error("Error logging out:", err)
      alert("Failed to log out.")
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-2xl text-blue-600">
        Loading HoD Dashboard...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen text-xl text-red-600 text-center p-4">
        {error}
      </div>
    )
  }

  if (!hodData) {
    return (
      <div className="flex justify-center items-center min-h-screen text-xl text-red-600 text-center p-4">
        No HoD data found. Please log in again.
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 font-sans">
      <header className="bg-blue-600 text-white p-4 shadow-md flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          HoD Dashboard - {hodData.department} Department
        </h1>
        <div className="flex items-center space-x-4">
          <span className="text-lg">
            Welcome, {hodData.firstName} {hodData.lastName}
          </span>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm transition-colors duration-200"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        <nav className="w-64 bg-gray-800 text-white p-4 shadow-lg">
          <ul className="list-none p-0 m-0">
            {[
              { id: "teachers", label: "Manage Teachers" },
              { id: "students", label: "Manage Students" },
              // Removed "Manage Subjects"
              // Removed "Manage Classes"
              { id: "attendance", label: "Attendance Statistics" },
              { id: "defaulters", label: "Defaulter Lists" },
              // Removed "Account Management"
            ].map((item) => (
              <li
                key={item.id}
                className={`py-3 px-4 cursor-pointer border-b border-gray-700 transition-colors duration-200
                  ${
                    activeTab === item.id
                      ? "bg-blue-700 font-bold"
                      : "hover:bg-gray-700"
                  }`}
                onClick={() => setActiveTab(item.id)}
              >
                {item.label}
              </li>
            ))}
          </ul>
        </nav>

        <main className="flex-1 p-8 overflow-y-auto">
          {activeTab === "teachers" && (
            <ManageTeachers departmentId={hodData.department} />
          )}
          {activeTab === "students" && (
            <ManageStudents departmentId={hodData.department} />
          )}
          {/* Removed conditional rendering for SubjectsManagement */}
          {/* Removed conditional rendering for ClassesManagement */}
          {activeTab === "attendance" && (
            <AttendanceStats departmentId={hodData.department} />
          )}
          {activeTab === "defaulters" && (
            <DefaulterLists departmentId={hodData.department} />
          )}
          {/* Removed conditional rendering for AccountManagement */}
          {/* Placeholder for future components if needed for attendance/defaulters */}
          {(activeTab === "attendance" || activeTab === "defaulters") && (
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {activeTab === "attendance"
                  ? "Attendance Statistics"
                  : "Defaulter Lists"}
              </h3>
              <p className="text-gray-600">
                Functionality for this section is not yet implemented.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default HodDashboard
