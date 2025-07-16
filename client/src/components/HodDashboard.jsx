import React, { useState, useEffect } from "react"
import { auth, db } from "../firebase/config" // Adjust path as needed
import { signOut } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { useNavigate } from "react-router-dom"

// Placeholder Components (You will create these fully in subsequent steps)
const TeachersManagement = ({ departmentId }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm">
    <h3 className="text-xl font-semibold text-gray-800 mb-2">
      Manage Teachers
    </h3>
    <p className="text-gray-600">
      Functionality to add, update, and view teachers for {departmentId}{" "}
      department.
    </p>
    {/* Teacher list, Add Teacher form, etc. */}
  </div>
)

const StudentsManagement = ({ departmentId }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm">
    <h3 className="text-xl font-semibold text-gray-800 mb-2">
      Manage Students
    </h3>
    <p className="text-gray-600">
      Functionality to add, update, and view students for {departmentId}{" "}
      department.
    </p>
    {/* Student list, Add Student form, etc. */}
  </div>
)

const SubjectsManagement = ({ departmentId }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm">
    <h3 className="text-xl font-semibold text-gray-800 mb-2">
      Manage Subjects
    </h3>
    <p className="text-gray-600">
      Functionality to add, update, and view subjects for {departmentId}{" "}
      department.
    </p>
    {/* Subject list, Add Subject form, etc. */}
  </div>
)

const ClassesManagement = ({ departmentId }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm">
    <h3 className="text-xl font-semibold text-gray-800 mb-2">Manage Classes</h3>
    <p className="text-gray-600">
      Functionality to add, update, and view classes for {departmentId}{" "}
      department.
    </p>
    {/* Class list, Add Class form, etc. */}
  </div>
)

const AttendanceStats = ({ departmentId }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm">
    <h3 className="text-xl font-semibold text-gray-800 mb-2">
      Department Attendance Statistics
    </h3>
    <p className="text-gray-600">
      Overview of attendance for {departmentId} department.
    </p>
    {/* Charts, summary data, etc. */}
  </div>
)

const DefaulterLists = ({ departmentId }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm">
    <h3 className="text-xl font-semibold text-gray-800 mb-2">
      Defaulter Lists
    </h3>
    <p className="text-gray-600">
      View and export lists of students with low attendance for {departmentId}{" "}
      department.
    </p>
    {/* Filters, export options, etc. */}
  </div>
)

const AccountManagement = ({ hodData }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm">
    <h3 className="text-xl font-semibold text-gray-800 mb-2">
      Account Management
    </h3>
    <p className="text-gray-600">
      Manage your HoD profile, reset passwords for students/teachers, reassign
      students.
    </p>
    {/* Password reset forms, student reassignment tools */}
  </div>
)

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
  }, [navigate])

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
              { id: "subjects", label: "Manage Subjects" },
              { id: "classes", label: "Manage Classes" },
              { id: "attendance", label: "Attendance Statistics" },
              { id: "defaulters", label: "Defaulter Lists" },
              { id: "account", label: "Account Management" },
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
            <TeachersManagement departmentId={hodData.department} />
          )}
          {activeTab === "students" && (
            <StudentsManagement departmentId={hodData.department} />
          )}
          {activeTab === "subjects" && (
            <SubjectsManagement departmentId={hodData.department} />
          )}
          {activeTab === "classes" && (
            <ClassesManagement departmentId={hodData.department} />
          )}
          {activeTab === "attendance" && (
            <AttendanceStats departmentId={hodData.department} />
          )}
          {activeTab === "defaulters" && (
            <DefaulterLists departmentId={hodData.department} />
          )}
          {activeTab === "account" && <AccountManagement hodData={hodData} />}
        </main>
      </div>
    </div>
  )
}

// The 'styles' object is no longer needed
// const styles = { ... };

export default HodDashboard
