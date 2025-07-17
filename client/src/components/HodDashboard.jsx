// src/components/HodDashboard.jsx

import React, { useState, useEffect } from "react"
import { auth, db } from "../firebase/config" // Adjust path as needed
import { signOut } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { useNavigate } from "react-router-dom"

// Import the necessary components
import ManageTeachers from "./ManageTeachers"
import ManageStudents from "./ManageStudents"
import AttendanceSummary from "./AttendanceSummary"

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
      alert("Logout Success!!")
      navigate("/")
    } catch (err) {
      console.error("Error logging out:", err)
      // Using a custom message box instead of alert()
      // You would replace this with your actual modal/message box component
      console.log("Failed to log out.")
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
              { id: "attendance", label: "Attendance Statistics" },
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
          {activeTab === "attendance" && hodData && hodData.department ? (
            <AttendanceSummary
              // Assuming AttendanceSummary also needs these props
              teacherId={hodData.uid} // Pass HOD's UID if needed by AttendanceSummary
              department={hodData.department}
              year={hodData.year} // Pass year if hodData has it, otherwise remove
              subjectsTaught={hodData.subjectsTaught || []} // Pass subjectsTaught if hodData has it, otherwise empty array
            />
          ) : activeTab === "attendance" ? (
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Attendance Statistics
              </h3>
              <p className="text-red-600">
                Department data is missing. Cannot load summary.
              </p>
              <p className="text-gray-600 mt-2">
                Debug info: {JSON.stringify(hodData, null, 2)}
              </p>
            </div>
          ) : null}

          {/* Render DefaulterList when activeTab is "defaulters" */}
          {activeTab === "defaulters" && hodData && hodData.department ? (
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <DefaulterList
                teacherId={hodData.uid} // Pass HOD's UID as teacherId
                department={hodData.department}
                year={hodData.year} // Pass year if hodData has it, otherwise remove
                subjectsTaught={hodData.subjectsTaught || []} // Pass subjectsTaught if hodData has it, otherwise empty array
              />
            </div>
          ) : activeTab === "defaulters" ? (
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Defaulter List
              </h3>
              <p className="text-red-600">
                Department data is missing. Cannot load defaulter list.
              </p>
              <p className="text-gray-600 mt-2">
                Debug info: {JSON.stringify(hodData, null, 2)}
              </p>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  )
}

export default HodDashboard
