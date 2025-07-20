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
import FullSummary from "./FullSummary" // Import the FullSummary component
// Assuming DefaulterList is another component you might have
// import DefaulterList from "./DefaulterList"; // Uncomment if you have this component

function HodDashboard() {
  const [hodData, setHodData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("teachers") // Default active tab
  const [isSidebarOpen, setIsSidebarOpen] = useState(false) // New state for mobile sidebar
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const hodDocRef = doc(db, "hods", user.uid)
        try {
          const hodDocSnap = await getDoc(hodDocRef)
          if (hodDocSnap.exists() && hodDocSnap.data().role === "HoD") {
            setHodData({ uid: user.uid, ...hodDocSnap.data() })
            // If the active tab was one of the removed ones or not "fullSummary",
            // default to 'teachers' or maintain current if valid.
            if (
              ![
                "teachers",
                "students",
                "attendance",
                "defaulters",
                "fullSummary", // Add "fullSummary" to valid tabs
              ].includes(activeTab)
            ) {
              setActiveTab("teachers")
            }
          } else {
            setError("Unauthorized access. Please log in as an HoD.")
            await signOut(auth)
            navigate("/hod-login")
          }
        } catch (err) {
          // console.error("Error fetching HoD data:", err)
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
      // console.log("Failed to log out.")
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
      <header className="bg-blue-600 text-white p-4 shadow-md flex justify-between items-center z-20">
        <div className="flex items-center">
          {/* Hamburger menu for mobile */}
          <button
            className="md:hidden text-white mr-4 focus:outline-none"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              ></path>
            </svg>
          </button>
          <h1 className="text-xl md:text-2xl font-bold">
            HoD Dashboard - {hodData.department} Dept.
          </h1>
        </div>
        <div className="flex items-center space-x-2 md:space-x-4">
          <span className="text-sm md:text-lg hidden md:block">
            Welcome, {hodData.firstName} {hodData.lastName}
          </span>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 md:px-4 md:py-2 rounded-md text-xs md:text-sm transition-colors duration-200"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex flex-1 relative">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        {/* Sidebar */}
        <nav
          className={`fixed inset-y-0 left-0 w-64 bg-gray-800 text-white p-4 shadow-lg transform ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:relative md:translate-x-0 transition-transform duration-300 ease-in-out z-20 md:z-auto`}
        >
          <ul className="list-none p-0 m-0">
            {[
              { id: "teachers", label: "Manage Teachers" },
              { id: "students", label: "Manage Students" },
              { id: "attendance", label: "Attendance Statistics" },
              { id: "fullSummary", label: "Full Attendance Summary" }, // New tab for FullSummary
              // { id: "defaulters", label: "Defaulter List" }, // Uncomment if DefaulterList is active
            ].map((item) => (
              <li
                key={item.id}
                className={`py-3 px-4 cursor-pointer border-b border-gray-700 transition-colors duration-200
                  ${
                    activeTab === item.id
                      ? "bg-blue-700 font-bold"
                      : "hover:bg-gray-700"
                  }`}
                onClick={() => {
                  setActiveTab(item.id)
                  setIsSidebarOpen(false) // Close sidebar on tab click for mobile
                }}
              >
                {item.label}
              </li>
            ))}
          </ul>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {activeTab === "teachers" && (
            <ManageTeachers departmentId={hodData.department} />
          )}
          {activeTab === "students" && (
            <ManageStudents departmentId={hodData.department} />
          )}
          {activeTab === "attendance" && hodData && hodData.department ? (
            <AttendanceSummary
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

          {/* Render FullSummary when activeTab is "fullSummary" */}
          {activeTab === "fullSummary" && hodData && hodData.department ? (
            <FullSummary
              teacherId={hodData.uid} // Pass HOD's UID, though FullSummary might not strictly need it
              department={hodData.department}
              year={hodData.year} // Pass year if hodData has it
              subjectsTaught={hodData.subjectsTaught || []} // Pass all subjects taught in the department
            />
          ) : activeTab === "fullSummary" ? (
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Full Attendance Summary
              </h3>
              <p className="text-red-600">
                Department data is missing. Cannot load full summary.
              </p>
              <p className="text-gray-600 mt-2">
                Debug info: {JSON.stringify(hodData, null, 2)}
              </p>
            </div>
          ) : null}

          {/* Render DefaulterList when activeTab is "defaulters" */}
          {/* Uncomment if you are using DefaulterList */}
          {/* {activeTab === "defaulters" && hodData && hodData.department ? (
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
          ) : null} */}
        </main>
      </div>
    </div>
  )
}

export default HodDashboard
